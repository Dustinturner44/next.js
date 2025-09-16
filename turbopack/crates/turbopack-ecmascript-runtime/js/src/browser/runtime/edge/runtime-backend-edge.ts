/**
 * This file contains the runtime code specific to the Turbopack development
 * ECMAScript "None" runtime (e.g. for Edge).
 *
 * It will be appended to the base development runtime code.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/// <reference path="../base/runtime-base.ts" />
/// <reference path="../../../shared/require-type.d.ts" />
/// <reference path="../../../shared-node/base-externals-utils.ts" />

type ChunkRunner = {
  requiredChunks: Set<ChunkPath>
  chunkPath: ChunkPath
  runtimeModuleIds: ModuleId[]
}

let BACKEND: RuntimeBackend
;(() => {
  BACKEND = {
    registerChunk(_chunkPath, params) {
      if (params == null) {
        return
      }

      // The "none" runtime expects all chunks within the same chunk group to be
      // registered before any of them are instantiated.
      // Furthermore, modules must be instantiated synchronously, hence we don't
      // use promises here.
      instantiateRuntimeModules(params.runtimeModuleIds)
    },

    loadChunkCached(_sourceType: SourceType, _chunkUrl: ChunkUrl) {
      throw new Error('chunk loading is not supported')
    },

    async loadWebAssembly(
      _sourceType: SourceType,
      _sourceData: SourceData,
      chunkPath: ChunkPath,
      edgeModule: () => WebAssembly.Module,
      imports: WebAssembly.Imports
    ): Promise<Exports> {
      const module = await loadEdgeWasm(chunkPath, edgeModule)

      return await WebAssembly.instantiate(module, imports)
    },

    async loadWebAssemblyModule(
      _sourceType: SourceType,
      _sourceData: SourceData,
      chunkPath: ChunkPath,
      edgeModule: () => WebAssembly.Module
    ): Promise<WebAssembly.Module> {
      return loadEdgeWasm(chunkPath, edgeModule)
    },
  } satisfies RuntimeBackend

  /**
   * Instantiates the runtime modules for the given chunk.
   */
  function instantiateRuntimeModules(runtimeModuleIds: ModuleId[]) {
    for (const moduleId of runtimeModuleIds) {
      getOrInstantiateRuntimeModule(undefined, moduleId)
    }
  }

  async function loadEdgeWasm(
    chunkPath: ChunkPath,
    edgeModule: () => WebAssembly.Module
  ): Promise<WebAssembly.Module> {
    let module
    try {
      module = edgeModule()
    } catch (_e) {}

    if (!module) {
      throw new Error(
        `dynamically loading WebAssembly is not supported in this runtime as global was not injected for chunk '${chunkPath}'`
      )
    }

    return module
  }
})()
