import { parentPort, workerData } from 'worker_threads'
import { pathToFileURL } from 'url'
import { register } from 'module'
import { join } from 'path'
import { normalizeConfig } from '../../server/config-shared'

async function importConfig() {
  try {
    register(pathToFileURL(join(import.meta.dirname, 'loader.js')).href, {
      parentURL: pathToFileURL(workerData.cwd).href,
      data: {
        cwd: workerData.cwd,
        compilerOptions: workerData.compilerOptions,
      },
    })

    const configModule = await import(
      pathToFileURL(workerData.nextConfigPath).href
    )

    // Config can be a function but postMessage data needs to be serialzable,
    // so normalize the config here.
    const config = await normalizeConfig(workerData.phase, configModule.default)

    parentPort?.postMessage({
      success: true,
      config,
    })
  } catch (error: any) {
    parentPort?.postMessage({
      success: false,
      error: error.message || 'Unknown error occurred while importing config',
      stack: error.stack || '',
      code: error.code || 'CONFIG_IMPORT_ERROR',
    })
  }
}

importConfig()
