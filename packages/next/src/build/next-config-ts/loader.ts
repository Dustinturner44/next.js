import type {
  InitializeHook,
  LoadHook,
  ModuleFormat,
  ResolveHook,
} from 'module'
import type { CompilerOptions } from 'typescript'

import { extname } from 'path'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { resolveSWCOptions } from './transpile-config.js'

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

  const ext = extname(specifier)
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
  const swcOptions = resolveSWCOptions({
    cwd,
    compilerOptions,
    type: 'es6',
  })
  const { code } = await transform(rawSource, swcOptions)

  return {
    format: 'module',
    shortCircuit: true,
    source: code,
  }
}
