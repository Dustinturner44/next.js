import { createAsyncLocalStorage } from './async-local-storage'
import type { WorkUnitAsyncStorage } from './work-unit-async-storage.external'

const instances: Set<WorkUnitAsyncStorage> =
  globalThis.__WORK_UNIT_STORE_INSTANCES ??
  (globalThis.__WORK_UNIT_STORE_INSTANCES = new Set())

const workUnitAsyncStorageInstance: WorkUnitAsyncStorage =
  createAsyncLocalStorage()

instances.add(workUnitAsyncStorageInstance)
console.log(
  `created workUnitAsyncStorage (instances: ${instances.size}, module id: ${module.id})`
)
workUnitAsyncStorageInstance.__INSTANCE_ID = instances.size

export { workUnitAsyncStorageInstance }
