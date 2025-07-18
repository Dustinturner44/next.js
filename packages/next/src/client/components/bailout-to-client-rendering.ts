import { BailoutToCSRError } from '../../shared/lib/lazy-dynamic/bailout-to-csr'
import { workAsyncStorage } from '../../server/app-render/work-async-storage.external'
import {
  workUnitAsyncStorage,
  WorkUnitType,
} from '../../server/app-render/work-unit-async-storage.external'

export function bailoutToClientRendering(reason: string): void | never {
  const workStore = workAsyncStorage.getStore()

  if (workStore?.forceStatic) return

  const workUnitStore = workUnitAsyncStorage.getStore()

  if (workUnitStore) {
    switch (workUnitStore.type) {
      case WorkUnitType.Prerender:
      case WorkUnitType.PrerenderClient:
      case WorkUnitType.PrerenderPPR:
      case WorkUnitType.PrerenderLegacy:
        throw new BailoutToCSRError(reason)
      case WorkUnitType.Request:
      case WorkUnitType.Cache:
      case WorkUnitType.UnstableCache:
        break
      default:
        workUnitStore satisfies never
    }
  }
}
