use std::rc::Rc;

use anyhow::Result;
use next_core::{
    self,
    next_client_reference::{CssClientReferenceModule, EcmascriptClientReferenceModule},
    next_server_component::server_component_module::NextServerComponentModule,
};
use rustc_hash::{FxHashMap, FxHashSet};
use serde::{Deserialize, Serialize};
use tracing::Instrument;
use turbo_tasks::{
    FxIndexSet, NonLocalValue, ResolvedVc, TryFlatJoinIterExt, Vc, debug::ValueDebugFormat,
    trace::TraceRawVcs,
};
use turbopack::css::chunk::CssChunkPlaceable;
use turbopack_core::{module::Module, module_graph::SingleModuleGraph};

#[derive(
    Copy,
    Clone,
    Serialize,
    Deserialize,
    Eq,
    PartialEq,
    Hash,
    TraceRawVcs,
    ValueDebugFormat,
    NonLocalValue,
)]
pub enum ClientReferenceMapType {
    EcmascriptClientReference {
        module: ResolvedVc<EcmascriptClientReferenceModule>,
        ssr_module: ResolvedVc<Box<dyn Module>>,
    },
    CssClientReference(ResolvedVc<Box<dyn CssChunkPlaceable>>),
    ServerComponent(ResolvedVc<NextServerComponentModule>),
}

#[turbo_tasks::value]
pub struct ClientReferencesSet {
    pub client_references: FxHashMap<ResolvedVc<Box<dyn Module>>, ClientReferenceMapType>,
    /// Every value in this map will have an associated `ClientReferenceMapType` in
    /// [client_references].
    /// This is a shallow map so the values will include other server components.  So to collect
    /// everything requires a recursive walk.
    #[allow(clippy::type_complexity)]
    pub client_references_per_server_component:
        FxHashMap<ResolvedVc<Box<dyn Module>>, Box<[ResolvedVc<Box<dyn Module>>]>>,
}

impl ClientReferencesSet {
    fn new(client_references: ClientReferencesSet) -> Vc<Self> {
        Self::cell(client_references)
    }
}

#[turbo_tasks::function]
pub async fn map_client_references(
    graph: Vc<SingleModuleGraph>,
) -> Result<Vc<ClientReferencesSet>> {
    let span = tracing::info_span!("mapping client references");
    async move {
        let graph = &*graph.await?;
        let client_references = graph
            .iter_nodes()
            .map(|node| async move {
                let module = node.module;

                if let Some(client_reference_module) =
                    ResolvedVc::try_downcast_type::<EcmascriptClientReferenceModule>(module)
                {
                    Ok(Some((
                        module,
                        ClientReferenceMapType::EcmascriptClientReference {
                            module: client_reference_module,
                            ssr_module: ResolvedVc::upcast(
                                client_reference_module.await?.ssr_module,
                            ),
                        },
                    )))
                } else if let Some(client_reference_module) =
                    ResolvedVc::try_downcast_type::<CssClientReferenceModule>(module)
                {
                    Ok(Some((
                        module,
                        ClientReferenceMapType::CssClientReference(
                            client_reference_module.await?.client_module,
                        ),
                    )))
                } else if let Some(server_component) =
                    ResolvedVc::try_downcast_type::<NextServerComponentModule>(module)
                {
                    Ok(Some((
                        module,
                        ClientReferenceMapType::ServerComponent(server_component),
                    )))
                } else {
                    Ok(None)
                }
            })
            .try_flat_join()
            .await?
            .into_iter()
            .collect::<FxHashMap<_, _>>();
        /// Collects the shallowly discoverable set of client references for each server component
        /// in DFS post order. Uses [memo] to avoid redundantly exploring the same parts of
        /// the graph when different server components have shared dependencies.
        /// In principle this means we will visit every node reachable from a server component at
        /// most once however cycles complicate this logic slightly.  The real problem is all the
        /// Vec<> copies and for that we observe that client references are somewhat rare and thus
        /// it should be common that many nodes share the same set of transitive deps.
        #[allow(clippy::type_complexity)]
        fn dfs_collect_shallow_client_references(
            is_root: bool,
            u: ResolvedVc<Box<dyn Module>>,
            graph: &SingleModuleGraph,
            client_references: &FxHashMap<ResolvedVc<Box<dyn Module>>, ClientReferenceMapType>,
            // We model empty as None instead of an empty vec to avoid allocations
            // Also store `Rc` since many nodes will have identical transitive deps.
            memo: &mut FxHashMap<
                ResolvedVc<Box<dyn Module>>,
                Option<Rc<Vec<ResolvedVc<Box<dyn Module>>>>>,
            >,
            // for cycle detection
            visiting_stack: &mut FxHashSet<ResolvedVc<Box<dyn Module>>>,
        ) -> Option<Rc<Vec<ResolvedVc<Box<dyn Module>>>>> {
            // Because we are only collecting shallowly discoverable references, short circuit on
            // each client reference, however roots are client references (server components) so
            // ignore those
            if !is_root && client_references.contains_key(&u) {
                return Some(Rc::from(vec![u]));
            }

            // 1. Memoization check: If already computed, return cached result.
            if let Some(cached_result) = memo.get(&u) {
                return cached_result.clone();
            }

            // 2. Cycle detection: If 'u' is currently in recursion stack, it's a cycle.
            // For DFS post-order, we simply don't add 'u' or its descendants from this path
            // until the cycle is naturally broken or handled by memoization from another path.
            if !visiting_stack.insert(u) {
                return None;
            }

            // 3. Recursively visit neighbors or consume ourselves, we don't consider client
            //    references to be traversable.
            let mut transitive_client_refs = None;
            let mut first = None;

            for v in graph.neighbors(u) {
                // This ignores back edges because we must have already visited them.
                if let Some(green_nodes_from_v) = dfs_collect_shallow_client_references(
                    false,
                    v,
                    graph,
                    client_references,
                    memo,
                    visiting_stack,
                ) {
                    // Merge results from sub-paths
                    // Save the first one on the relatively likely chance that we don't actually
                    // accumulate _more_.
                    match &first {
                        None => {
                            first = Some(green_nodes_from_v.clone());
                        }
                        Some(first) => match transitive_client_refs.as_mut() {
                            None => {
                                transitive_client_refs =
                                    Some(FxIndexSet::from_iter(first.iter().copied()));
                            }
                            Some(refs) => {
                                refs.extend(green_nodes_from_v.iter());
                            }
                        },
                    }
                }
            }
            // 4. Flatten to a Vec, but optimize for the case where we acucmulated all transitive
            //    deps from the first non-empty neighbor and reuse the Rc
            let result = match (first, transitive_client_refs) {
                (Some(first), Some(refs)) => {
                    if refs.len() == refs.len() {
                        // we got references from multiple neighbors but never accumulated a new
                        // dependency
                        Some(first)
                    } else {
                        Some(Rc::from(refs.into_iter().collect::<Vec<_>>()))
                    }
                }
                (Some(first), None) => {
                    // only had one neighbor with deps
                    Some(first)
                }
                // None of our neighbors had deps.
                (None, _) => None,
            };

            // 5. Save the result in memo
            memo.insert(u, result.clone());

            visiting_stack.remove(&u); // Unmark 'u' as visiting

            result // Return the computed list
        }

        let mut memo = FxHashMap::default();
        let mut client_references_per_server_component = FxHashMap::default();
        for (&module, client_reference_type) in &client_references {
            let ClientReferenceMapType::ServerComponent(_) = client_reference_type else {
                continue;
            };
            client_references_per_server_component.insert(
                module,
                dfs_collect_shallow_client_references(
                    true,
                    module,
                    graph,
                    &client_references,
                    &mut memo,
                    &mut FxHashSet::default(),
                ),
            );
        }
        // Drop everything from the map except server components, this frees memory and, critically,
        // decrements ref counts so we can avoid copies below.
        drop(memo);

        let client_references_per_server_component = client_references_per_server_component
            .into_iter()
            .filter_map(|(k, v)| match v {
                None => None,
                Some(refs) => {
                    // Avoid a copy in the common cas
                    let refs: Box<[_]> = match Rc::try_unwrap(refs) {
                        Ok(owned) => owned.into_boxed_slice(),
                        Err(shared) => shared.to_vec().into_boxed_slice(),
                    };
                    Some((k, refs))
                }
            })
            .collect();

        Ok(ClientReferencesSet::new(ClientReferencesSet {
            client_references,
            client_references_per_server_component,
        }))
    }
    .instrument(span)
    .await
}
