import type { LoaderTree } from '../lib/app-dir-module'
import type { Params } from '../request/params'
import type { GetDynamicParamFromSegment } from './app-render'
import { parseLoaderTree } from './parse-loader-tree'

export function getRootParams(
  loaderTree: LoaderTree,
  getDynamicParamFromSegment: GetDynamicParamFromSegment
): Params {
  return getRootParamsImpl({}, loaderTree, getDynamicParamFromSegment)
}

function getRootParamsImpl(
  parentParams: Params,
  loaderTree: LoaderTree,
  getDynamicParamFromSegment: GetDynamicParamFromSegment
): Params {
  const {
    segment,
    modules: { layout },
    parallelRoutes,
  } = parseLoaderTree(loaderTree)

  const segmentParam = getDynamicParamFromSegment(segment)

  let currentParams: Params = parentParams
  if (segmentParam && segmentParam.value !== null) {
    currentParams = {
      ...parentParams,
      [segmentParam.param]: segmentParam.value,
    }
  }

  const isRootLayout = typeof layout !== 'undefined'

  if (isRootLayout) {
    return currentParams
  } else if (!parallelRoutes.children) {
    // This should really be an error but there are bugs in Turbopack that cause
    // the _not-found LoaderTree to not have any layouts. For rootParams sake
    // this is somewhat irrelevant when you are not customizing the 404 page.
    // If you are customizing 404
    // TODO update rootParams to make all params optional if `/app/not-found.tsx` is defined
    return currentParams
  } else {
    return getRootParamsImpl(
      currentParams,
      // We stop looking for root params as soon as we hit the first layout and
      // it is not possible to use parallel route children above the root layout
      // so every parallelRoutes object that this function can visit will
      // necessarily have a single `children` prop and no others.
      parallelRoutes.children,
      getDynamicParamFromSegment
    )
  }
}
