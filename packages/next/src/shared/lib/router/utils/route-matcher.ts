import type { Group } from './route-regex'
import { DecodeError } from '../../utils'
import type { Params } from '../../../../server/request/params'
import { safeRouteMatcher } from './route-match-utils'

export interface RouteMatchFn {
  (pathname: string): false | Params
}

type RouteMatcherOptions = {
  // We only use the exec method of the RegExp object. This helps us avoid using
  // type assertions that the passed in properties are of the correct type.
  re: Pick<RegExp, 'exec'>
  groups: Record<string, Group>

  /**
   * Whether this set of route options has been cached. If it has been cached,
   * then we should also cache the route matcher function as the expectation is
   * that the options reference will be retained in an LRU cache.
   */
  cache?: boolean
}

/**
 * WeakMap cache for route matcher functions. This works in conjunction with the
 * LRU cache in getRouteRegex() to provide efficient two-tier caching:
 *
 * 1. getRouteRegex() LRU cache ensures identical route patterns return the same
 *    RouteRegex object (providing object identity consistency)
 * 2. This WeakMap caches RouteMatchFn based on RouteMatcherOptions object identity
 * 3. When RouteMatchFn goes out of scope, the WeakMap automatically cleans up
 *    since the returned function closes over the options parameter
 *
 * Cache flow: route pattern → LRU hit → same RouteRegex → WeakMap hit → same RouteMatchFn
 */
const routeMatcherCache = new WeakMap<RouteMatcherOptions, RouteMatchFn>()

export function getRouteMatcher(options: RouteMatcherOptions): RouteMatchFn {
  // Check if the route matcher is already cached and return it if it is.
  let routeMatcher: RouteMatchFn | undefined
  if (options.cache) {
    routeMatcher = routeMatcherCache.get(options)
    if (routeMatcher) {
      return routeMatcher
    }
  }

  const { re, groups } = options

  // Wrap with safe matcher to handle parameter cleaning
  routeMatcher = safeRouteMatcher((pathname: string) => {
    const routeMatch = re.exec(pathname)
    if (!routeMatch) return false

    const decode = (param: string) => {
      try {
        return decodeURIComponent(param)
      } catch {
        throw new DecodeError('failed to decode param')
      }
    }

    const params: Params = {}
    for (const [key, group] of Object.entries(groups)) {
      const match = routeMatch[group.pos]
      if (match !== undefined) {
        if (group.repeat) {
          params[key] = match.split('/').map((entry) => decode(entry))
        } else {
          params[key] = decode(match)
        }
      }
    }

    return params
  })

  // Cache the route matcher if the options indicate that it should be cached.
  if (options.cache) {
    routeMatcherCache.set(options, routeMatcher)
  }

  return routeMatcher
}
