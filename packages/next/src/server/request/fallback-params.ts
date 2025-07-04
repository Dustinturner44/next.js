import { getRouteParamKeys } from '../../shared/lib/router/utils/route-param-keys'
import { getRouteRegex } from '../../shared/lib/router/utils/route-regex'

export type FallbackRouteParams = ReadonlyMap<string, string>

export function getFallbackRouteParams(
  pageOrKeys: string | readonly string[]
): FallbackRouteParams | null {
  let keys: readonly string[]
  if (typeof pageOrKeys === 'string') {
    const { groups } = getRouteRegex(pageOrKeys)
    keys = getRouteParamKeys(groups)
  } else {
    keys = pageOrKeys
  }

  // If there are no keys, we can return early.
  if (keys.length === 0) return null

  const params = new Map<string, string>()

  // As we're creating unique keys for each of the dynamic route params, we only
  // need to generate a unique ID once per request because each of the keys will
  // be also be unique.
  const uniqueID = Math.random().toString(16).slice(2)

  for (const key of keys) {
    params.set(key, `%%drp:${key}:${uniqueID}%%`)
  }

  return params
}
