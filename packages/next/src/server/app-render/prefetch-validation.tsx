import type {
  CacheNodeSeedData,
  HeadData,
  InitialRSCPayload,
  LoadingModuleData,
  Segment,
} from '../../shared/lib/app-router-types'
import { InvariantError } from '../../shared/lib/invariant-error'
import { scheduleInSequentialTasks } from './app-render-render-utils'
import { createPromiseWithResolvers } from '../../shared/lib/promise-with-resolvers'
import { getServerModuleMap } from './encryption-utils'
import { Suspense, type ReactNode } from 'react'
import { isThenable } from '../../shared/lib/is-thenable'
import { inspect } from 'node:util'

type StageChunks = Record<RenderStage, Uint8Array[]>

export function renderInStagesAndCollectChunks(
  render: (
    runtimeStagePromise: Promise<void>,
    dynamicStagePromise: Promise<void>
  ) => ReadableStream<Uint8Array>
): [stream: Promise<ReadableStream<Uint8Array>>, chunks: Promise<StageChunks>] {
  // This is not a prerender, but we want to use the same logic.
  let currentStage: RenderStage = RenderStage.Static
  const getStage = () => currentStage

  // TODO: bad if render() crashes
  let chunksResult: Promise<StageChunks> = null!

  const runtimeStagePromise = createPromiseWithResolvers<void>()
  const dynamicStagePromise = createPromiseWithResolvers<void>()

  const renderResult = scheduleInSequentialTasks(
    () => {
      const [stream, teedStream] = render(
        runtimeStagePromise.promise,
        dynamicStagePromise.promise
      ).tee()

      chunksResult = collectStageChunksFromDynamicRender(teedStream, getStage)
      return stream
    },
    () => {
      currentStage = RenderStage.Runtime
      runtimeStagePromise.resolve()
    },
    () => {
      currentStage = RenderStage.Dynamic
      dynamicStagePromise.resolve()
    }
  )
  return [renderResult, chunksResult]
}

// export function renderInStagesAndCollectChunks(
//   render: () => ReadableStream<Uint8Array>,
//   callbacks: { onRuntime: () => void; onDynamic: () => void }
// ): [stream: Promise<ReadableStream<Uint8Array>>, chunks: Promise<StageChunks>] {
//   // This is not a prerender, but we want to use the same logic.
//   let currentStage: RenderStage = RenderStage.Static
//   const chunks: StageChunks = {
//     [RenderStage.Static]: [],
//     [RenderStage.Runtime]: [],
//     [RenderStage.Dynamic]: [],
//   }
//   const chunksResult = createPromiseWithResolvers<StageChunks>()

//   const renderResult = scheduleInSequentialTasks(
//     () => {
//       const [stream, teedStream] = render().tee()
//       // Gather the chunks and group them into stages.
//       ;(async () => {
//         const reader = teedStream.getReader()
//         while (true) {
//           let item: ReadableStreamReadResult<Uint8Array<ArrayBufferLike>>
//           try {
//             item = await reader.read()
//           } catch (err) {
//             chunksResult.reject(err)
//             break
//           }
//           if (!item.done) {
//             chunks[currentStage].push(item.value)
//           } else {
//             chunksResult.resolve(chunks)
//             break
//           }
//         }
//       })()
//       return stream
//     },
//     () => {
//       const nextStage = RenderStage.Runtime
//       // The content rendered in this stage is a superset of the previous stage.
//       chunks[nextStage].push(...chunks[currentStage])
//       currentStage = nextStage

//       callbacks.onRuntime()
//     },
//     () => {
//       const nextStage = RenderStage.Dynamic
//       // The content rendered in this stage is a superset of the previous stage.
//       chunks[nextStage].push(...chunks[currentStage])
//       currentStage = nextStage

//       callbacks.onDynamic()
//     }
//   )
//   return [renderResult, chunksResult.promise]
// }

export function collectStageChunksFromDynamicRender(
  stream: ReadableStream<Uint8Array>,
  getStage: () => RenderStage
): Promise<StageChunks> {
  let lastChunkStage: RenderStage | null = null
  const chunks: StageChunks = {
    [RenderStage.Static]: [],
    [RenderStage.Runtime]: [],
    [RenderStage.Dynamic]: [],
  }

  // Gather the chunks and group them into stages.
  return new Promise<StageChunks>(async (resolve, reject) => {
    const reader = stream.getReader()
    while (true) {
      let item: ReadableStreamReadResult<Uint8Array<ArrayBufferLike>>
      try {
        item = await reader.read()
      } catch (err) {
        return reject(err)
      }
      if (!item.done) {
        const currentStage = getStage()

        // If we changed to a new stage, we have to copy over the chunks emitted in the previous stage --
        // stage N+1 is a superset of stage N.
        if (lastChunkStage !== null && lastChunkStage !== currentStage) {
          chunks[currentStage].push(...chunks[lastChunkStage])
        }

        chunks[currentStage].push(item.value)
        lastChunkStage = currentStage
      } else {
        return resolve(chunks)
      }
    }
  })
}

type TODO = any

const { createFromReadableStream } =
  // eslint-disable-next-line import/no-extraneous-dependencies
  require('react-server-dom-webpack/client') as typeof import('react-server-dom-webpack/client')

const findSourceMapURL =
  process.env.NODE_ENV !== 'production'
    ? (require('../lib/source-maps') as typeof import('../lib/source-maps'))
        .findSourceMapURLDEV
    : undefined

export async function validateRuntimePrefetches(
  initialRSCPayload: InitialRSCPayload,
  clientReferenceManifest: TODO,
  stageChunks: StageChunks,
  prerenderClient: (
    getPayload: () => Promise<InitialRSCPayload>
  ) => Promise<string>
) {
  const runtimeSegmentsToValidate = new Set<SegmentPath>()
  const validationRouteTree = createValidationRouteTree(
    initialRSCPayload,
    runtimeSegmentsToValidate
  )
  // If we don't have any runtime segments in the tree, we can bail out early.
  if (runtimeSegmentsToValidate.size === 0) {
    return
  }

  const serverConsumerManifest = {
    // moduleLoading must be null because we don't want to trigger preloads of ClientReferences
    // to be added to the consumer. Instead, we'll wait for any ClientReference to be emitted
    // which themselves will handle the preloading.
    moduleLoading: null,
    moduleMap: clientReferenceManifest.rscModuleMapping,
    serverModuleMap: getServerModuleMap(),
  }

  for (const runtimeSegmentToValidate of runtimeSegmentsToValidate) {
    const sentinelBoundaryId = `__next-sentinel-boundary-${Date.now()}`

    const prelude = await prerenderClient(async () => {
      // TODO: this seems sketchy wrt transferring preloads, maybe we should disassemble the segments separately?
      // alternatively, maybe try doing this lazily when we access one of the stages
      const cache = createValidationCache()
      for (const stage of [
        // RenderStage.Static, // we can omit the static segments, they are not currently used for validation.
        RenderStage.Runtime,
        RenderStage.Dynamic,
      ]) {
        const chunks = stageChunks[stage]
        const initialRSCPayloadInStage: InitialRSCPayload =
          await createFromReadableStream(
            createUnclosingPrefetchStream(streamFromChunks(chunks)),
            {
              findSourceMapURL,
              serverConsumerManifest,
            }
          )
        fillCacheWithRootSeedData(cache, stage, initialRSCPayloadInStage)
      }

      const combinedSeedData = createValidationSeedData(
        cache,
        validationRouteTree,
        runtimeSegmentToValidate,
        sentinelBoundaryId
      )
      const combinedRSCPayload: InitialRSCPayload = {
        ...initialRSCPayload,
        f: [
          // We expect the root path to only have three elements.
          [
            initialRSCPayload.f[0][0], // TODO: what is this?
            combinedSeedData satisfies CacheNodeSeedData,
            null satisfies HeadData, // TODO: handle head
          ],
        ],
      }
      return combinedRSCPayload
    })
    if (prelude.includes(sentinelBoundaryId)) {
      // TODO: this needs to go into the render a la resolveValidation
      console.error(
        '❌ Runtime prefetchable segment did not produce an instant result',
        runtimeSegmentToValidate
      )
    } else {
      console.log(
        '✅ Runtime prefetchable segment is OK',
        runtimeSegmentToValidate
      )
    }
    console.log(prelude)
  }
}

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    },
  })
}

// TODO: duplicated from collect-segment-data, extract as a helper
function createUnclosingPrefetchStream(
  originalFlightStream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  // When PPR is enabled, prefetch streams may contain references that never
  // resolve, because that's how we encode dynamic data access. In the decoded
  // object returned by the Flight client, these are reified into hanging
  // promises that suspend during render, which is effectively what we want.
  // The UI resolves when it switches to the dynamic data stream
  // (via useDeferredValue(dynamic, static)).
  //
  // However, the Flight implementation currently errors if the server closes
  // the response before all the references are resolved. As a cheat to work
  // around this, we wrap the original stream in a new stream that never closes,
  // and therefore doesn't error.
  const reader = originalFlightStream.getReader()
  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (!done) {
          // Pass to the target stream and keep consuming the Flight response
          // from the server.
          controller.enqueue(value)
          continue
        }
        // The server stream has closed. Exit, but intentionally do not close
        // the target stream.
        return
      }
    },
  })
}

function getRootDataFromPayload(initialRSCPayload: InitialRSCPayload) {
  // FlightDataPath is an unsound type, hence the additional checks.
  const flightDataPaths = initialRSCPayload.f
  if (flightDataPaths.length !== 1 && flightDataPaths[0].length !== 3) {
    throw new InvariantError(
      'InitialRSCPayload does not match the expected shape during prefetch validation.'
    )
  }
  const seedData: CacheNodeSeedData = flightDataPaths[0][1]
  // TODO: handle head
  const head: HeadData = flightDataPaths[0][2]

  return { seedData, head }
}

function createValidationRouteTree(
  initialRSCPayload: InitialRSCPayload,
  pathsToValidate: Set<SegmentPath>
) {
  const { seedData } = getRootDataFromPayload(initialRSCPayload)
  return createValidationRouteTreeFromSeedData(seedData, pathsToValidate)
}

export function needsRuntimePrefetchValidation(
  initialRSCPayload: InitialRSCPayload
) {
  // TODO(prefetch-validation): this is hacky
  const pathsToValidate = new Set<SegmentPath>()
  const tree = createValidationRouteTree(initialRSCPayload, pathsToValidate)
  console.log(
    `needsRuntimePrefetchValidation: ${pathsToValidate.size > 0}\n${[...pathsToValidate]}\n${inspect(tree, { depth: undefined, colors: true })}`
  )
  return pathsToValidate.size > 0
}

export enum RenderStage {
  Static = 1,
  Runtime = 2,
  Dynamic = 3,
}

//=====================================
// Validation tree
//=====================================

type SegmentPath = string & { _tag: 'SegmentPath' }

type ValidationRouteTree = {
  path: SegmentPath
  slots: { [parallelRouteKey: string]: ValidationRouteTree }
}

function createValidationRouteTreeFromSeedData(
  seedData: CacheNodeSeedData,
  pathsToValidate: Set<SegmentPath>
): ValidationRouteTree {
  const rootPath = stringifySegment(seedData[0])
  return createValidationRouteTreeImpl(rootPath, seedData, pathsToValidate)
}

function createValidationRouteTreeImpl(
  path: SegmentPath,
  seedData: CacheNodeSeedData,
  pathsToValidate: Set<SegmentPath>
): ValidationRouteTree {
  const [
    _segment,
    _node,
    parallelRoutesData,
    _loading,
    _isPartial,
    hasRuntimePrefetch,
  ] = seedData

  if (hasRuntimePrefetch) {
    pathsToValidate.add(path)
  }

  const slots: ValidationRouteTree['slots'] = {}
  for (const parallelRouteKey in parallelRoutesData) {
    const childSeedData = parallelRoutesData[parallelRouteKey]
    if (!childSeedData) {
      throw new InvariantError(
        `Got unexpected empty seed data during prefetch validation`
      )
    }

    const childSegment = childSeedData[0]
    const childPath = createChildSegmentPath(
      path,
      parallelRouteKey,
      childSegment
    )

    slots[parallelRouteKey] = createValidationRouteTreeImpl(
      childPath,
      childSeedData,
      pathsToValidate
    )
  }

  return { path, slots }
}

function fillCacheWithRootSeedData(
  cache: ValidationSegmentCache,
  group: RenderStage,
  initialRSCPayload: InitialRSCPayload
) {
  // TODO: handle head as well
  const { seedData } = getRootDataFromPayload(initialRSCPayload)
  fillCacheForStage(cache, group, seedData)
}

function fillCacheForStage(
  cache: ValidationSegmentCache,
  group: RenderStage,
  seedData: CacheNodeSeedData
): void {
  const rootPath = stringifySegment(seedData[0])
  return fillCacheForStageImpl(cache, group, rootPath, seedData)
}

function fillCacheForStageImpl(
  cache: ValidationSegmentCache,
  group: RenderStage,
  path: SegmentPath,
  seedData: CacheNodeSeedData
): void {
  const [_segment, _node, parallelRoutesData, _loading, _isPartial] = seedData

  writeSegmentIntoValidationCache(
    cache,
    group,
    path,
    createSegmentSeedData(seedData)
  )

  for (const parallelRouteKey in parallelRoutesData) {
    const childSeedData = parallelRoutesData[parallelRouteKey]
    if (!childSeedData) {
      throw new InvariantError(
        `Got unexpected empty seed data during prefetch validation`
      )
    }

    const childSegment = childSeedData[0]
    const childPath = createChildSegmentPath(
      path,
      parallelRouteKey,
      childSegment
    )

    fillCacheForStageImpl(cache, group, childPath, childSeedData)
  }
}

function createChildSegmentPath(
  parentPath: SegmentPath,
  parallelRouteKey: string,
  segment: Segment
): SegmentPath {
  return `${parentPath}/${encodeURIComponent(parallelRouteKey)}:${stringifySegment(segment)}` as SegmentPath
}

function stringifySegment(segment: Segment): SegmentPath {
  return (
    typeof segment === 'string'
      ? encodeURIComponent(segment)
      : encodeURIComponent(segment[0]) + '|' + segment[1] + '|' + segment[2]
  ) as SegmentPath
}

function createValidationSeedData(
  cache: ValidationSegmentCache,
  fullValidationTree: ValidationRouteTree,
  pathToRuntimeSegment: SegmentPath,
  sentinelBoundaryId: string
): CacheNodeSeedData {
  function createSeedDataFromValidationTreeImpl(
    validationTree: ValidationRouteTree,
    isParentBeingValidated: boolean
  ) {
    const { path, slots } = validationTree
    const isFirstSegmentToValidate = path === pathToRuntimeSegment
    const isSegmentBeingValidated =
      isParentBeingValidated || isFirstSegmentToValidate
    const group = isSegmentBeingValidated
      ? RenderStage.Runtime
      : RenderStage.Dynamic

    const segmentSeedData = readSegmentFromValidationCache(cache, group, path)
    if (!segmentSeedData) {
      throw new InvariantError(
        `Validation segment was present in tree but missing from cache: ${inspectSegmentKey(createSegmentKey(group, path))}`
      )
    }
    const wrappedSegmentSeedData: SegmentSeedData = {
      ...segmentSeedData,
    }
    // TODO: we could try to detect if child slots suspended
    // by adding a "trigger when rendered" client component fallback
    // that resuspends (to avoid changing the behavior)
    if (isFirstSegmentToValidate) {
      const wrap = (element: ReactNode) => (
        <Suspense fallback={sentinelBoundaryId}>{element}</Suspense>
      )
      const { node, loading } = wrappedSegmentSeedData
      if (!loading) {
        wrappedSegmentSeedData.node = wrap(node)
      } else {
        // If we have a loading element, we should be fine, but we wrap it just in case it suspends.
        if (isThenable(loading)) {
          throw new InvariantError(
            'Got unexpected promise for `loading` in seed data'
          )
        }
        wrappedSegmentSeedData.loading = [
          wrap(loading[0]),
          loading[1],
          loading[2],
        ]
      }
    }

    const slotsSeedData: CacheNodeSeedDataSlots = {}
    for (const parallelRouteKey in slots) {
      slotsSeedData[parallelRouteKey] = createSeedDataFromValidationTreeImpl(
        slots[parallelRouteKey],
        isSegmentBeingValidated
      )
    }
    return getCacheNodeSeedDataFromSegment(
      wrappedSegmentSeedData,
      slotsSeedData
    )
  }

  return createSeedDataFromValidationTreeImpl(fullValidationTree, false)
}

//=====================================
// Segment seed data
//=====================================

/** An object version of `CacheNodeSeedData`, without slots. */
type SegmentSeedData = {
  segment: Segment
  node: React.ReactNode | null
  loading: LoadingModuleData | Promise<LoadingModuleData>
  isPartial: boolean
  hasRuntimePrefetch: boolean
}

function createSegmentSeedData(seedData: CacheNodeSeedData): SegmentSeedData {
  const [
    segment,
    node,
    _parallelRoutesData,
    loading,
    isPartial,
    hasRuntimePrefetch,
  ] = seedData
  return {
    segment,
    node,
    loading,
    isPartial,
    hasRuntimePrefetch,
  }
}
type CacheNodeSeedDataSlots = CacheNodeSeedData[2]

function getCacheNodeSeedDataFromSegment(
  data: SegmentSeedData,
  slots: CacheNodeSeedDataSlots
): CacheNodeSeedData {
  return [
    data.segment,
    data.node,
    slots,
    data.loading,
    data.isPartial,
    data.hasRuntimePrefetch,
  ]
}

//=====================================
// Validation segment cache
//=====================================

export function getSegmentGroupsFromValidationCache(
  cache: ValidationSegmentCache
) {
  return {
    shared: cache[RenderStage.Dynamic],
    static: cache[RenderStage.Static],
    runtime: cache[RenderStage.Runtime],
  }
}

export function createValidationCacheFromSegmentGroups(
  groups: ReturnType<typeof getSegmentGroupsFromValidationCache>
): ValidationSegmentCache {
  return {
    [RenderStage.Dynamic]: groups.shared,
    [RenderStage.Static]: groups.static,
    [RenderStage.Runtime]: groups.runtime,
  }
}

function createValidationCache(): ValidationSegmentCache {
  return {
    [RenderStage.Dynamic]: null,
    [RenderStage.Static]: null,
    [RenderStage.Runtime]: null,
  }
}

type ValidationSegmentCache = {
  [group in RenderStage]: Map<ValidationSegmentKey[1], SegmentSeedData> | null
}

type ValidationSegmentKey = [group: RenderStage, path: string]

function createSegmentKey(
  group: RenderStage,
  path: string
): ValidationSegmentKey {
  return [group, path]
}

function inspectSegmentKey(key: ValidationSegmentKey): string {
  const [group, path] = key
  return `[${RenderStage[group]}, "${path}"]`
}

function writeSegmentIntoValidationCache(
  cache: ValidationSegmentCache,
  group: RenderStage,
  path: string,
  seedData: SegmentSeedData
) {
  let groupMap = cache[group]
  if (!groupMap) {
    groupMap = cache[group] = new Map()
  }
  if (groupMap.has(path)) {
    throw new InvariantError(
      `Unexpected duplicate segment ${inspectSegmentKey(createSegmentKey(group, path))}`
    )
  }
  groupMap.set(path, seedData)
}

function readSegmentFromValidationCache(
  cache: ValidationSegmentCache,
  group: RenderStage,
  path: string
): SegmentSeedData | undefined {
  const groupMap = cache[group]
  if (!groupMap) return undefined
  return groupMap.get(path) ?? undefined
}
