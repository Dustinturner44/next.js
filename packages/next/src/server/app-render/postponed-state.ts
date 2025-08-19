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
import { lengthDecodeTuple, lengthEncodeTuple } from './length-encoding'

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

type SerializedStateParts =
  | SerializedDynamicData
  | SerializedDynamicHTML
  | SerializedDynamicHTMLWithReplacements

type SerializedDynamicData = [resumeDataCache: string]
type SerializedDynamicHTML = [postponed: string, resumeDataCache: string]
type SerializedDynamicHTMLWithReplacements = [
  replacements: string,
  postponed: string,
  resumeDataCache: string,
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
    return lengthEncodeTuple([
      dataString,
      await stringifyResumeDataCache(
        createRenderResumeDataCache(resumeDataCache)
      ),
    ] satisfies SerializedDynamicHTML)
  }

  const replacements: Array<[string, string]> = Array.from(fallbackRouteParams)
  const replacementsString = JSON.stringify(replacements)

  return lengthEncodeTuple([
    replacementsString,
    dataString,
    await stringifyResumeDataCache(resumeDataCache),
  ] satisfies SerializedDynamicHTMLWithReplacements)
}

export async function getDynamicDataPostponedState(
  resumeDataCache: PrerenderResumeDataCache | RenderResumeDataCache
): Promise<string> {
  return lengthEncodeTuple([
    await stringifyResumeDataCache(
      createRenderResumeDataCache(resumeDataCache)
    ),
  ] satisfies SerializedDynamicData)
}

export function parsePostponedState(
  state: string,
  params: Params | undefined
): PostponedState {
  try {
    const parts = lengthDecodeTuple(state) as SerializedStateParts
    if (parts.length === 1) {
      parts satisfies SerializedDynamicData
      const [resumeDataCacheString] = parts
      const renderResumeDataCache = createRenderResumeDataCache(
        resumeDataCacheString
      )
      return {
        type: DynamicState.DATA,
        renderResumeDataCache,
      }
    } else if (parts.length === 2 || parts.length === 3) {
      let replacementsString: string | null = null,
        postponedString: string,
        resumeDataCacheString: string

      if (parts.length === 2) {
        parts satisfies SerializedDynamicHTML
        ;[postponedString, resumeDataCacheString] = parts
      } else {
        parts satisfies SerializedDynamicHTMLWithReplacements
        ;[replacementsString, postponedString, resumeDataCacheString] = parts
      }

      const renderResumeDataCache = createRenderResumeDataCache(
        resumeDataCacheString
      )

      try {
        if (replacementsString !== null) {
          const replacements = JSON.parse(replacementsString) as ReadonlyArray<
            [string, string]
          >
          for (const [key, searchValue] of replacements) {
            const value = params?.[key] ?? ''
            const replaceValue = Array.isArray(value) ? value.join('/') : value
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
    } else {
      parts satisfies never
      throw new InvariantError('Postponed state tuple has invalid length')
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
