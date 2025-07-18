import type { WorkStore } from '../app-render/work-async-storage.external'

import {
  postponeWithTracking,
  type DynamicTrackingState,
} from '../app-render/dynamic-rendering'

import {
  workUnitAsyncStorage,
  WorkUnitType,
  type PrerenderStore,
} from '../app-render/work-unit-async-storage.external'
import { makeHangingPromise } from '../dynamic-rendering-utils'
import { InvariantError } from '../../shared/lib/invariant-error'

export function createServerPathnameForMetadata(
  underlyingPathname: string,
  workStore: WorkStore
): Promise<string> {
  const workUnitStore = workUnitAsyncStorage.getStore()
  if (workUnitStore) {
    switch (workUnitStore.type) {
      case WorkUnitType.Prerender:
      case WorkUnitType.PrerenderClient:
      case WorkUnitType.PrerenderPPR:
      case WorkUnitType.PrerenderLegacy: {
        return createPrerenderPathname(
          underlyingPathname,
          workStore,
          workUnitStore
        )
      }
      case WorkUnitType.Request:
      case WorkUnitType.Cache:
      case WorkUnitType.UnstableCache:
        break
      default:
        workUnitStore satisfies never
    }
  }
  return createRenderPathname(underlyingPathname)
}

function createPrerenderPathname(
  underlyingPathname: string,
  workStore: WorkStore,
  prerenderStore: PrerenderStore
): Promise<string> {
  const fallbackParams = workStore.fallbackRouteParams
  if (fallbackParams && fallbackParams.size > 0) {
    switch (prerenderStore.type) {
      case WorkUnitType.Prerender:
        return makeHangingPromise<string>(
          prerenderStore.renderSignal,
          '`pathname`'
        )
      case WorkUnitType.PrerenderClient:
        throw new InvariantError(
          'createPrerenderPathname was called inside a client component scope.'
        )
      case WorkUnitType.PrerenderPPR:
        return makeErroringPathname(workStore, prerenderStore.dynamicTracking)
      case WorkUnitType.PrerenderLegacy:
        return makeErroringPathname(workStore, null)
      default:
        prerenderStore satisfies never
    }
  }

  // We don't have any fallback params so we have an entirely static safe params object
  return Promise.resolve(underlyingPathname)
}

function makeErroringPathname<T>(
  workStore: WorkStore,
  dynamicTracking: null | DynamicTrackingState
): Promise<T> {
  let reject: null | ((reason: unknown) => void) = null
  const promise = new Promise<T>((_, re) => {
    reject = re
  })

  const originalThen = promise.then.bind(promise)

  // We instrument .then so that we can generate a tracking event only if you actually
  // await this promise, not just that it is created.
  promise.then = (onfulfilled, onrejected) => {
    if (reject) {
      try {
        postponeWithTracking(
          workStore.route,
          'metadata relative url resolving',
          dynamicTracking
        )
      } catch (error) {
        reject(error)
        reject = null
      }
    }
    return originalThen(onfulfilled, onrejected)
  }

  // We wrap in a noop proxy to trick the runtime into thinking it
  // isn't a native promise (it's not really). This is so that awaiting
  // the promise will call the `then` property triggering the lazy postpone
  return new Proxy(promise, {})
}

function createRenderPathname(underlyingPathname: string): Promise<string> {
  return Promise.resolve(underlyingPathname)
}
