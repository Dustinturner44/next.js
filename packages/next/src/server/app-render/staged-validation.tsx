import { getLayoutOrPageModule } from '../lib/app-dir-module'
import type { LoaderTree } from '../lib/app-dir-module'
import { parseLoaderTree } from '../../shared/lib/router/utils/parse-loader-tree'
import type { AppSegmentConfig } from '../../build/segment-config/app/app-segment-config'
import { RenderStage } from './staged-rendering'

export async function anySegmentHasRuntimePrefetchEnabled(
  tree: LoaderTree
): Promise<boolean> {
  const { mod: layoutOrPageMod } = await getLayoutOrPageModule(tree)

  // TODO(restart-on-cache-miss): Does this work correctly for client page/layout modules?
  const prefetchConfig = layoutOrPageMod
    ? (layoutOrPageMod as AppSegmentConfig).unstable_prefetch
    : undefined
  /** Whether this segment should use a runtime prefetch instead of a static prefetch. */
  const hasRuntimePrefetch = prefetchConfig?.mode === 'runtime'
  if (hasRuntimePrefetch) {
    return true
  }

  const { parallelRoutes } = parseLoaderTree(tree)
  for (const parallelRouteKey in parallelRoutes) {
    const parallelRoute = parallelRoutes[parallelRouteKey]
    const hasChildRuntimePrefetch =
      await anySegmentHasRuntimePrefetchEnabled(parallelRoute)
    if (hasChildRuntimePrefetch) {
      return true
    }
  }

  return false
}

export type StageChunks = { chunks: ChunksByStage; finishedIn: RenderStage }
export type ChunksByStage = Record<RenderStage, Uint8Array[]>

export function collectStageChunksFromStagedRender(
  stream: ReadableStream<Uint8Array>,
  getCurrentStage: () => RenderStage
): Promise<StageChunks> {
  let lastChunkStage: RenderStage | null = null
  const chunks: ChunksByStage = {
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
      const currentStage = getCurrentStage()
      if (!item.done) {
        // If we changed to a new stage, we have to copy over the chunks emitted in the previous stage --
        // stage N+1 is a superset of stage N.
        if (lastChunkStage !== null && lastChunkStage !== currentStage) {
          chunks[currentStage].push(...chunks[lastChunkStage])
        }

        chunks[currentStage].push(item.value)
        lastChunkStage = currentStage
      } else {
        // TODO: we should consider an API that allows yielding a stage's chunks as soon as it completes
        return resolve({ chunks, finishedIn: currentStage })
      }
    }
  })
}

export function recreateServerStreamInStage(
  stageChunks: StageChunks,
  stage: RenderStage
) {
  // If we're recreating a stream for a stage before the stream ended,
  // then it won't be a complete RSC stream.
  // (i.e. it'll contain references to rows that never appear).
  // In that case, the stream should stay unclosed to avoid "Connection Closed" from Fizz.
  // (see `createUnclosingPrefetchStream` for more explanation)
  const shouldClose = stage < stageChunks.finishedIn ? false : true
  return streamFromChunks(stageChunks.chunks[stage], shouldClose)
}

function streamFromChunks(
  chunks: Uint8Array[],
  shouldClose: boolean = true
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      if (shouldClose) {
        controller.close()
      }
    },
  })
}
