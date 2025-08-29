import type {
  InitializeHook,
  LoadHook,
  ModuleFormat,
  ResolveHook,
} from 'module'
import type { Options as SWCOptions } from '@swc/core'
import type { CompilerOptions } from 'typescript'

import path from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'

const tsExts = new Set(['.ts', '.mts', '.cts'])
const localContext = new Map<string, any>()

export const initialize: InitializeHook<{
  cwd: string
  compilerOptions: CompilerOptions
}> = async ({ cwd, compilerOptions }) => {
  localContext.set('cwd', cwd)
  localContext.set('compilerOptions', compilerOptions)
}

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  // next.config.* should first be imported during the process of loadConfig(),
  // so we expect the parentURL is available.
  if (!context.parentURL) {
    return nextResolve(specifier, context)
  }

  // e.g. "next", "react", etc.
  // Packages that look like bare specifiers depending on the "baseUrl"
  // should already be resolved path by SWC.
  if (!specifier.startsWith('.') && !URL.canParse(specifier)) {
    return nextResolve(specifier, context)
  }

  const ext = path.extname(specifier)
  // If the specifier has no extension, we try to resolve it as TS file.
  // This is to mainly to prevent a breaking change for ESM projects that use
  // "next.config.ts".
  if (ext === '') {
    const possibleTsFileURL = new URL(specifier + '.ts', context.parentURL)
    if (existsSync(possibleTsFileURL)) {
      return {
        format: 'typescript' as ModuleFormat,
        shortCircuit: true,
        url: possibleTsFileURL.href,
      }
    }

    if (existsSync(new URL(specifier + '.js', context.parentURL))) {
      return nextResolve(specifier + '.js', context)
    }

    return nextResolve(specifier, context)
  }

  // Node.js resolver can take care of the rest of the non-TS files.
  if (!tsExts.has(ext)) {
    return nextResolve(specifier, context)
  }

  return {
    format: 'typescript' as ModuleFormat,
    shortCircuit: true,
    url: new URL(specifier, context.parentURL).href,
  }
}

export const load: LoadHook = async (url, context, nextLoad) => {
  if (context.format !== ('typescript' as ModuleFormat)) {
    return nextLoad(url, context)
  }

  const cwd = localContext.get('cwd')
  if (!cwd) {
    throw new Error(
      'The "cwd" value was not passed to the config loader from the registration. This is a bug in Next.js.'
    )
  }
  const compilerOptions: CompilerOptions = localContext.get('compilerOptions')
  if (!compilerOptions) {
    throw new Error(
      'The "compilerOptions" value was not passed to the config loader from the registration. This is a bug in Next.js.'
    )
  }

  const rawSource = await readFile(fileURLToPath(url), 'utf-8')
  // Lazy load swc to reduce the initial loader registration time.
  const { transform } = await import('../swc/index.js')
  const { code } = await transform(rawSource, {
    jsc: {
      parser: {
        syntax: 'typescript',
      },
      ...(compilerOptions.paths ? { paths: compilerOptions.paths } : {}),
      ...(compilerOptions.baseUrl
        ? // Needs to be an absolute path.
          { baseUrl: path.resolve(cwd, compilerOptions.baseUrl) }
        : compilerOptions.paths
          ? // If paths is given, baseUrl is required.
            { baseUrl: cwd }
          : {}),
      experimental: {
        keepImportAttributes: true,
        // Without this option, `assert` assertion also transpiles to `with` attribute,
        // which will throw if in Node.js version that does not support `with`.
        // Switch from Import Assertions to Import Attributes held at v21.0.0, v20.10.0, v18.20.0.
        emitAssertForImportAttributes: true,
      },
    },
    env: {
      targets: {
        // Setting the Node.js version can reduce unnecessary code generation.
        node: process?.versions?.node ?? '20.19.0',
      },
    },
  } satisfies SWCOptions)

  return {
    format: 'module',
    shortCircuit: true,
    source: code,
  }
}
