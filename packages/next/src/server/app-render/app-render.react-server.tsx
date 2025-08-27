import React from 'react'
import { NEXT_URL } from '../../client/components/app-router-headers'
import type { GlobalErrorComponent } from '../../client/components/builtin/global-error'
import isError from '../../lib/is-error'
import { createMetadataContext } from '../../lib/metadata/metadata-context'
import type { MetadataErrorType } from '../../lib/metadata/resolve-metadata'
import type { RequestStore } from '../app-render/work-unit-async-storage.external'
import type { LoaderTree } from '../lib/app-dir-module'
import type { AppRenderContext } from './app-render'
import { createComponentStylesAndScripts } from './create-component-styles-and-scripts'
import { createComponentTree } from './create-component-tree'
import { createFlightRouterStateFromLoaderTree } from './create-flight-router-state-from-loader-tree'
import { parseLoaderTree } from './parse-loader-tree'
import { normalizeConventionFilePath } from './segment-explorer-path'
import type {
  ActionResult,
  CacheNodeSeedData,
  FlightData,
  FlightDataPath,
  InitialRSCPayload,
  PreloadCallbacks,
  RSCPayload,
} from './types'
import { walkTreeWithFlightRouterState } from './walk-tree-with-flight-router-state'

const flightDataPathHeadKey = 'h'
const getFlightViewportKey = (requestId: string) => requestId + 'v'
const getFlightMetadataKey = (requestId: string) => requestId + 'm'

function NonIndex({
  pagePath,
  statusCode,
  isPossibleServerAction,
}: {
  pagePath: string
  statusCode: number | undefined
  isPossibleServerAction: boolean
}) {
  const is404Page = pagePath === '/404'
  const isInvalidStatusCode = typeof statusCode === 'number' && statusCode > 400

  // Only render noindex for page request, skip for server actions
  // TODO: is this correct if `isPossibleServerAction` is a false positive?
  if (!isPossibleServerAction && (is404Page || isInvalidStatusCode)) {
    return <meta name="robots" content="noindex" />
  }
  return null
}

/**
 * This is used by server actions & client-side navigations to generate RSC data
 * from a client-side request. This function is only called on "dynamic"
 * requests (ie, there wasn't already a static response). It uses request
 * headers (namely `Next-Router-State-Tree`) to determine where to start
 * rendering.
 */
export async function generateDynamicRSCPayload(
  ctx: AppRenderContext,
  options?: {
    actionResult: ActionResult
    skipFlight: boolean
  }
): Promise<RSCPayload> {
  // Flight data that is going to be passed to the browser. Currently a single
  // item array but in the future multiple patches might be combined in a single
  // request.

  // We initialize `flightData` to an empty string because the client router
  // knows how to tolerate it (treating it as an MPA navigation). The only time
  // this function wouldn't generate flight data is for server actions, if the
  // server action handler instructs this function to skip it. When the server
  // action reducer sees a falsy value, it'll simply resolve the action with no
  // data.
  let flightData: FlightData = ''

  const {
    componentMod: {
      tree: loaderTree,
      createMetadataComponents,
      MetadataBoundary,
      ViewportBoundary,
    },
    getDynamicParamFromSegment,
    appUsingSizeAdjustment,
    query,
    requestId,
    flightRouterState,
    workStore,
    url,
  } = ctx

  const serveStreamingMetadata = !!ctx.renderOpts.serveStreamingMetadata

  if (!options?.skipFlight) {
    const preloadCallbacks: PreloadCallbacks = []

    const {
      ViewportTree,
      MetadataTree,
      getViewportReady,
      getMetadataReady,
      StreamingMetadataOutlet,
    } = createMetadataComponents({
      tree: loaderTree,
      parsedQuery: query,
      pathname: url.pathname,
      metadataContext: createMetadataContext(ctx.renderOpts),
      getDynamicParamFromSegment,
      appUsingSizeAdjustment,
      workStore,
      MetadataBoundary,
      ViewportBoundary,
      serveStreamingMetadata,
    })

    flightData = (
      await walkTreeWithFlightRouterState({
        ctx,
        loaderTreeToFilter: loaderTree,
        parentParams: {},
        flightRouterState,
        // For flight, render metadata inside leaf page
        rscHead: (
          <React.Fragment key={flightDataPathHeadKey}>
            {/* noindex needs to be blocking */}
            <NonIndex
              pagePath={ctx.pagePath}
              statusCode={ctx.res.statusCode}
              isPossibleServerAction={ctx.isPossibleServerAction}
            />
            {/* Adding requestId as react key to make metadata remount for each render */}
            <ViewportTree key={getFlightViewportKey(requestId)} />
            <MetadataTree key={getFlightMetadataKey(requestId)} />
          </React.Fragment>
        ),
        injectedCSS: new Set(),
        injectedJS: new Set(),
        injectedFontPreloadTags: new Set(),
        rootLayoutIncluded: false,
        getViewportReady,
        getMetadataReady,
        preloadCallbacks,
        StreamingMetadataOutlet,
      })
    ).map((path) => path.slice(1)) // remove the '' (root) segment
  }

  // If we have an action result, then this is a server action response.
  // We can rely on this because `ActionResult` will always be a promise, even if
  // the result is falsey.
  if (options?.actionResult) {
    return {
      a: options.actionResult,
      f: flightData,
      b: ctx.sharedContext.buildId,
    }
  }

  // Otherwise, it's a regular RSC response.
  return {
    b: ctx.sharedContext.buildId,
    f: flightData,
    S: workStore.isStaticGeneration,
  }
}

/**
 * Crawlers will inadvertently think the canonicalUrl in the RSC payload should
 * be crawled when our intention is to just seed the router state with the
 * current URL. This function splits up the pathname so that we can later join
 * it on when we're ready to consume the path.
 */
function prepareInitialCanonicalUrl(url: RequestStore['url']) {
  return (url.pathname + url.search).split('/')
}

// This is the data necessary to render <AppRouter /> when no SSR errors are
// encountered
export async function getRSCPayload(
  tree: LoaderTree,
  ctx: AppRenderContext,
  is404: boolean
): Promise<InitialRSCPayload & { P: React.ReactNode }> {
  const injectedCSS = new Set<string>()
  const injectedJS = new Set<string>()
  const injectedFontPreloadTags = new Set<string>()
  let missingSlots: Set<string> | undefined

  // We only track missing parallel slots in development
  if (process.env.NODE_ENV === 'development') {
    missingSlots = new Set<string>()
  }

  const {
    getDynamicParamFromSegment,
    query,
    appUsingSizeAdjustment,
    componentMod: {
      createMetadataComponents,
      MetadataBoundary,
      ViewportBoundary,
    },
    url,
    workStore,
  } = ctx

  const initialTree = createFlightRouterStateFromLoaderTree(
    tree,
    getDynamicParamFromSegment,
    query
  )
  const serveStreamingMetadata = !!ctx.renderOpts.serveStreamingMetadata
  const hasGlobalNotFound = !!tree[2]['global-not-found']

  const {
    ViewportTree,
    MetadataTree,
    getViewportReady,
    getMetadataReady,
    StreamingMetadataOutlet,
  } = createMetadataComponents({
    tree,
    // When it's using global-not-found, metadata errorType is undefined, which
    // will retrieve the metadata from the page. When it's using not-found,
    // metadata errorType is 'not-found', which will retrieve the metadata from
    // the not-found.js boundary.
    // TODO: remove this condition and keep it undefined when global-not-found
    // is stabilized.
    errorType: is404 && !hasGlobalNotFound ? 'not-found' : undefined,
    parsedQuery: query,
    pathname: url.pathname,
    metadataContext: createMetadataContext(ctx.renderOpts),
    getDynamicParamFromSegment,
    appUsingSizeAdjustment,
    workStore,
    MetadataBoundary,
    ViewportBoundary,
    serveStreamingMetadata,
  })

  const preloadCallbacks: PreloadCallbacks = []

  const seedData = await createComponentTree({
    ctx,
    loaderTree: tree,
    parentParams: {},
    injectedCSS,
    injectedJS,
    injectedFontPreloadTags,
    rootLayoutIncluded: false,
    getViewportReady,
    getMetadataReady,
    missingSlots,
    preloadCallbacks,
    authInterrupts: ctx.renderOpts.experimental.authInterrupts,
    StreamingMetadataOutlet,
  })

  // When the `vary` response header is present with `Next-URL`, that means
  // there's a chance it could respond differently if there's an interception
  // route. We provide this information to `AppRouter` so that it can properly
  // seed the prefetch cache with a prefix, if needed.
  const varyHeader = ctx.res.getHeader('vary')
  const couldBeIntercepted =
    typeof varyHeader === 'string' && varyHeader.includes(NEXT_URL)

  const initialHead = (
    <React.Fragment key={flightDataPathHeadKey}>
      <NonIndex
        pagePath={ctx.pagePath}
        statusCode={ctx.res.statusCode}
        isPossibleServerAction={ctx.isPossibleServerAction}
      />
      <ViewportTree />
      <MetadataTree />
    </React.Fragment>
  )

  const { GlobalError, styles: globalErrorStyles } = await getGlobalErrorStyles(
    tree,
    ctx
  )

  // Assume the head we're rendering contains only partial data if PPR is
  // enabled and this is a statically generated response. This is used by the
  // client Segment Cache after a prefetch to determine if it can skip the
  // second request to fill in the dynamic data.
  //
  // See similar comment in create-component-tree.tsx for more context.
  const isPossiblyPartialHead =
    workStore.isStaticGeneration &&
    ctx.renderOpts.experimental.isRoutePPREnabled === true

  return {
    // See the comment above the `Preloads` component (below) for why this is
    // part of the payload
    P: <Preloads preloadCallbacks={preloadCallbacks} />,
    b: ctx.sharedContext.buildId,
    p: ctx.assetPrefix,
    c: prepareInitialCanonicalUrl(url),
    i: !!couldBeIntercepted,
    f: [
      [
        initialTree,
        seedData,
        initialHead,
        isPossiblyPartialHead,
      ] as FlightDataPath,
    ],
    m: missingSlots,
    G: [GlobalError, globalErrorStyles],
    s: typeof ctx.renderOpts.postponed === 'string',
    S: workStore.isStaticGeneration,
  }
}

/**
 * Preload calls (such as `ReactDOM.preloadStyle` and `ReactDOM.preloadFont`)
 * need to be called during rendering in order to create the appropriate preload
 * tags in the DOM, otherwise they're a no-op. Since we invoke
 * renderToReadableStream with a function that returns component props rather
 * than a component itself, we use this component to "render  " the preload
 * calls.
 */
function Preloads({ preloadCallbacks }: { preloadCallbacks: Function[] }) {
  preloadCallbacks.forEach((preloadFn) => preloadFn())
  return null
}

// This is the data necessary to render <AppRouter /> when an error state is
// triggered
export async function getErrorRSCPayload(
  tree: LoaderTree,
  ctx: AppRenderContext,
  ssrError: unknown,
  errorType: MetadataErrorType | 'redirect' | undefined
) {
  const {
    getDynamicParamFromSegment,
    query,
    appUsingSizeAdjustment,
    componentMod: {
      createMetadataComponents,
      MetadataBoundary,
      ViewportBoundary,
    },
    url,
    workStore,
  } = ctx

  const serveStreamingMetadata = !!ctx.renderOpts.serveStreamingMetadata
  const { MetadataTree, ViewportTree } = createMetadataComponents({
    tree,
    parsedQuery: query,
    pathname: url.pathname,
    metadataContext: createMetadataContext(ctx.renderOpts),
    errorType,
    getDynamicParamFromSegment,
    appUsingSizeAdjustment,
    workStore,
    MetadataBoundary,
    ViewportBoundary,
    serveStreamingMetadata: serveStreamingMetadata,
  })

  const initialHead = (
    <React.Fragment key={flightDataPathHeadKey}>
      <NonIndex
        pagePath={ctx.pagePath}
        statusCode={ctx.res.statusCode}
        isPossibleServerAction={ctx.isPossibleServerAction}
      />
      <ViewportTree />
      {process.env.NODE_ENV === 'development' && (
        <meta name="next-error" content="not-found" />
      )}
      <MetadataTree />
    </React.Fragment>
  )

  const initialTree = createFlightRouterStateFromLoaderTree(
    tree,
    getDynamicParamFromSegment,
    query
  )

  let err: Error | undefined = undefined
  if (ssrError) {
    err = isError(ssrError) ? ssrError : new Error(ssrError + '')
  }

  // For metadata notFound error there's no global not found boundary on top
  // so we create a not found page with AppRouter
  const seedData: CacheNodeSeedData = [
    initialTree[0],
    <html id="__next_error__">
      <head></head>
      <body>
        {process.env.NODE_ENV !== 'production' && err ? (
          <template
            data-next-error-message={err.message}
            data-next-error-digest={'digest' in err ? err.digest : ''}
            data-next-error-stack={err.stack}
          />
        ) : null}
      </body>
    </html>,
    {},
    null,
    false,
  ]

  const { GlobalError, styles: globalErrorStyles } = await getGlobalErrorStyles(
    tree,
    ctx
  )

  const isPossiblyPartialHead =
    workStore.isStaticGeneration &&
    ctx.renderOpts.experimental.isRoutePPREnabled === true

  return {
    b: ctx.sharedContext.buildId,
    p: ctx.assetPrefix,
    c: prepareInitialCanonicalUrl(url),
    m: undefined,
    i: false,
    f: [
      [
        initialTree,
        seedData,
        initialHead,
        isPossiblyPartialHead,
      ] as FlightDataPath,
    ],
    G: [GlobalError, globalErrorStyles],
    s: typeof ctx.renderOpts.postponed === 'string',
    S: workStore.isStaticGeneration,
  } satisfies InitialRSCPayload
}

export function createValidationOutlet() {
  let resolveValidation: (loggingFunction: () => void) => void
  let outlet = new Promise<React.ReactNode>((resolve) => {
    resolveValidation = (loggingFunction: () => void) => {
      resolve(<LogSafely fn={loggingFunction} />)
    }
  })
  return [resolveValidation!, outlet] as const
}

async function LogSafely({ fn }: { fn: () => unknown }) {
  try {
    await fn()
  } catch {}
  return null
}

async function getGlobalErrorStyles(
  tree: LoaderTree,
  ctx: AppRenderContext
): Promise<{
  GlobalError: GlobalErrorComponent
  styles: React.ReactNode | undefined
}> {
  const {
    modules: { 'global-error': globalErrorModule },
  } = parseLoaderTree(tree)

  const GlobalErrorComponent: GlobalErrorComponent =
    ctx.componentMod.GlobalError
  let globalErrorStyles
  if (globalErrorModule) {
    const [, styles] = await createComponentStylesAndScripts({
      ctx,
      filePath: globalErrorModule[1],
      getComponent: globalErrorModule[0],
      injectedCSS: new Set(),
      injectedJS: new Set(),
    })
    globalErrorStyles = styles
  }
  if (ctx.renderOpts.dev) {
    const dir =
      process.env.NEXT_RUNTIME === 'edge'
        ? process.env.__NEXT_EDGE_PROJECT_DIR!
        : ctx.renderOpts.dir || ''

    const globalErrorModulePath = normalizeConventionFilePath(
      dir,
      globalErrorModule?.[1]
    )
    if (ctx.renderOpts.devtoolSegmentExplorer && globalErrorModulePath) {
      const { SegmentViewNode } = ctx.componentMod
      globalErrorStyles = (
        // This will be rendered next to GlobalError component under ErrorBoundary,
        // it requires a key to avoid React warning about duplicate keys.
        <SegmentViewNode
          key="ge-svn"
          type="global-error"
          pagePath={globalErrorModulePath}
        >
          {globalErrorStyles}
        </SegmentViewNode>
      )
    }
  }

  return {
    GlobalError: GlobalErrorComponent,
    styles: globalErrorStyles,
  }
}
