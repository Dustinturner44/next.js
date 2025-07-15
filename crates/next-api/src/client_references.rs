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
        #[allow(clippy::type_complexity)]
        fn dfs_collect_shallow_client_references(
            u: ResolvedVc<Box<dyn Module>>,
            graph: &SingleModuleGraph,
            client_references: &FxHashMap<ResolvedVc<Box<dyn Module>>, ClientReferenceMapType>,
            memo: &mut FxHashMap<ResolvedVc<Box<dyn Module>>, Rc<Vec<ResolvedVc<Box<dyn Module>>>>>,
            visiting_stack: &mut FxHashSet<ResolvedVc<Box<dyn Module>>>, /* For cycle detection
                                                                          * in
                                                                          * current DFS path */
        ) -> Option<Rc<Vec<ResolvedVc<Box<dyn Module>>>>> {
            // Because we are only collecting shallowly discoverable references, short circuit on
            // each client reference
            if client_references.contains_key(&u) {
                return Some(Rc::from(vec![u]));
            }

            // 1. Memoization check: If already computed, return cached result.
            if let Some(cached_result) = memo.get(&u) {
                return Some(cached_result.clone());
            }

            // 2. Cycle detection: If 'u' is currently in recursion stack, it's a cycle.
            // For DFS post-order, we simply don't add 'u' or its descendants from this path
            // until the cycle is naturally broken or handled by memoization from another path.
            // We return an empty list for this path to avoid infinite recursion.
            if visiting_stack.contains(&u) {
                return None;
            }

            visiting_stack.insert(u); // Mark 'u' as currently visiting

            // 3. Recursively visit neighbors or consume ourselves, we don't consider client
            //    references to be traversable.
            let mut reachable_green_from_u = FxIndexSet::default();

            for v in graph.neighbors(u) {
                if let Some(green_nodes_from_v) = dfs_collect_shallow_client_references(
                    v,
                    graph,
                    client_references,
                    memo,
                    visiting_stack,
                ) {
                    // Merge results from sub-paths
                    reachable_green_from_u.extend(green_nodes_from_v.iter());
                }
            }

            // 4. Flatten to a Vec
            let reachable_green_from_u: Rc<Vec<_>> =
                Rc::from(reachable_green_from_u.into_iter().collect::<Vec<_>>());

            // 5. Save the result for 'u'
            memo.insert(u, reachable_green_from_u.clone());

            visiting_stack.remove(&u); // Unmark 'u' as visiting

            Some(reachable_green_from_u) // Return the computed list
        }

        let mut memo = FxHashMap::default();
        let mut client_references_per_server_component = FxHashMap::default();
        for (module, client_reference_type) in &client_references {
            let ClientReferenceMapType::ServerComponent(_) = client_reference_type else {
                continue;
            };
            dfs_collect_shallow_client_references(
                *module,
                graph,
                &client_references,
                &mut memo,
                &mut FxHashSet::default(),
            )
            .expect("entry points cannot be in the middle of a cycle");
        }
        // Drop everything from the map except server components, this frees memory and decrements
        // ref counts so we can avoid copies later.
        memo.retain(|k, _| {
            matches!(
                client_references.get(k),
                Some(ClientReferenceMapType::ServerComponent(_))
            )
        });
        for (module, client_reference_type) in &client_references {
            let ClientReferenceMapType::ServerComponent(_) = client_reference_type else {
                continue;
            };
            let refs = memo
                .remove(module)
                .expect("everything was already computed");
            // In the most common case each server component should be the only thing retaining the
            // Rc, if not, then at least the next one will get to avoid the copy.
            let refs: Box<[_]> = match Rc::try_unwrap(refs) {
                Ok(owned) => owned.into_boxed_slice(),
                Err(shared) => shared.to_vec().into_boxed_slice(),
            };
            client_references_per_server_component.insert(*module, refs);
        }
        debug_assert!(memo.is_empty());

        Ok(ClientReferencesSet::new(ClientReferencesSet {
            client_references,
            client_references_per_server_component,
        }))
    }
    .instrument(span)
    .await
}
