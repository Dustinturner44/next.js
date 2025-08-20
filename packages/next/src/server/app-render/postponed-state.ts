import type { FallbackRouteParams } from '../../server/request/fallback-params'
import { InvariantError } from '../../shared/lib/invariant-error'
import type { Params } from '../request/params'
import {
  createPrerenderResumeDataCache,
  createRenderResumeDataCache,
  type PrerenderResumeDataCache,
  type RenderResumeDataCache,
} from '../resume-data-cache/resume-data-cache'
import { stringifyResumeDataCache } from '../resume-data-cache/resume-data-cache'
import {
  lengthDecodeTupleWithTag,
  lengthEncodeTupleWithTag,
} from './length-encoding'

export enum DynamicState {
  /**
   * The dynamic access occurred during the RSC render phase.
   */
  DATA = 1,

  /**
   * The dynamic access occurred during the HTML shell render phase.
   */
  HTML = 2,
}

/**
 * The postponed state for dynamic data.
 */
export type DynamicDataPostponedState = {
  /**
   * The type of dynamic state.
   */
  readonly type: DynamicState.DATA

  /**
   * The immutable resume data cache.
   */
  readonly renderResumeDataCache: RenderResumeDataCache
}

/**
 * The postponed state for dynamic HTML.
 */
export type DynamicHTMLPostponedState = {
  /**
   * The type of dynamic state.
   */
  readonly type: DynamicState.HTML

  /**
   * The postponed data used by React.
   */
  readonly data: [
    preludeState: DynamicHTMLPreludeState,
    postponed: ReactPostponed,
  ]

  /**
   * The immutable resume data cache.
   */
  readonly renderResumeDataCache: RenderResumeDataCache
}

export const enum DynamicHTMLPreludeState {
  Empty = 0,
  Full = 1,
}

type ReactPostponed = NonNullable<
  import('react-dom/static').PrerenderResult['postponed']
>

export type PostponedState =
  | DynamicDataPostponedState
  | DynamicHTMLPostponedState

function serializeStateParts(state: SerializedStateParts) {
  return lengthEncodeTupleWithTag(state)
}

function deserializeStateParts(serialized: string) {
  return lengthDecodeTupleWithTag(serialized) as SerializedStateParts
}

type SerializedStateParts =
  | SerializedDynamicData
  | SerializedDynamicHTML
  | SerializedDynamicHTMLWithReplacements

enum SerializedStateTag {
  DynamicData = 0,
  DynamicHTML = 1,
  DynamicHTMLWithReplacements = 2,
}

type SerializedDynamicData = [
  tag: SerializedStateTag.DynamicData,
  resumeDataCache: string,
]
type SerializedDynamicHTML = [
  tag: SerializedStateTag.DynamicHTML,
  resumeDataCache: string,
  postponed: string,
]
type SerializedDynamicHTMLWithReplacements = [
  tag: SerializedStateTag.DynamicHTMLWithReplacements,
  resumeDataCache: string,
  postponed: string,
  replacements: string,
]

export async function getDynamicHTMLPostponedState(
  postponed: ReactPostponed,
  preludeState: DynamicHTMLPreludeState,
  fallbackRouteParams: FallbackRouteParams | null,
  resumeDataCache: PrerenderResumeDataCache | RenderResumeDataCache
): Promise<string> {
  const data: DynamicHTMLPostponedState['data'] = [preludeState, postponed]
  const dataString = JSON.stringify(data)

  if (!fallbackRouteParams || fallbackRouteParams.size === 0) {
    return serializeStateParts([
      SerializedStateTag.DynamicHTML,
      await stringifyResumeDataCache(
        createRenderResumeDataCache(resumeDataCache)
      ),
      dataString,
    ])
  }

  const replacements: Array<[string, string]> = Array.from(fallbackRouteParams)
  const replacementsString = JSON.stringify(replacements)

  return serializeStateParts([
    SerializedStateTag.DynamicHTMLWithReplacements,
    await stringifyResumeDataCache(resumeDataCache),
    dataString,
    replacementsString,
  ])
}

export async function getDynamicDataPostponedState(
  resumeDataCache: PrerenderResumeDataCache | RenderResumeDataCache
): Promise<string> {
  return serializeStateParts([
    SerializedStateTag.DynamicData,
    await stringifyResumeDataCache(
      createRenderResumeDataCache(resumeDataCache)
    ),
  ])
}

export function parsePostponedState(
  state: string,
  params: Params | undefined
): PostponedState {
  try {
    const parts = deserializeStateParts(state)
    const tag = parts[0]
    switch (tag) {
      case SerializedStateTag.DynamicData: {
        const [, resumeDataCacheString] = parts
        const renderResumeDataCache = createRenderResumeDataCache(
          resumeDataCacheString
        )
        return {
          type: DynamicState.DATA,
          renderResumeDataCache,
        }
      }
      case SerializedStateTag.DynamicHTML:
      case SerializedStateTag.DynamicHTMLWithReplacements: {
        // These two variants mostly overlap, except for the last element
        let [, resumeDataCacheString, postponedString] = parts

        const renderResumeDataCache = createRenderResumeDataCache(
          resumeDataCacheString
        )
        try {
          if (tag === SerializedStateTag.DynamicHTMLWithReplacements) {
            const replacementsString = parts[3]
            const replacements = JSON.parse(
              replacementsString
            ) as ReadonlyArray<[string, string]>
            for (const [key, searchValue] of replacements) {
              const value = params?.[key] ?? ''
              const replaceValue = Array.isArray(value)
                ? value.join('/')
                : value
              postponedString = postponedString.replaceAll(
                searchValue,
                replaceValue
              )
            }
          }

          return {
            type: DynamicState.HTML,
            data: JSON.parse(postponedString),
            renderResumeDataCache,
          }
        } catch (err) {
          console.error('Failed to parse postponed state', err)
          return { type: DynamicState.DATA, renderResumeDataCache }
        }
      }
      default: {
        parts satisfies never
        throw new InvariantError(`Invalid postponed state tag: ${tag}`)
      }
    }
  } catch (err) {
    console.error('Failed to parse postponed state', err)
    return {
      type: DynamicState.DATA,
      renderResumeDataCache: createPrerenderResumeDataCache(),
    }
  }
}

export function getPostponedFromState(state: DynamicHTMLPostponedState) {
  const [preludeState, postponed] = state.data
  return { preludeState, postponed }
}
