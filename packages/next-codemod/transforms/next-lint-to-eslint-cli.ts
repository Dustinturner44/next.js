import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { getPkgManager, installPackages } from '../lib/handle-package'
import { createParserFromPath } from '../lib/parser'
import { white, bold, red, yellow, green, magenta } from 'picocolors'

export const prefixes = {
  wait: white(bold('○')),
  error: red(bold('⨯')),
  warn: yellow(bold('⚠')),
  ready: '▲', // no color
  info: white(bold(' ')),
  event: green(bold('✓')),
  trace: magenta(bold('»')),
} as const

interface TransformerOptions {
  skipInstall?: boolean
  [key: string]: unknown
}

const ESLINT_CONFIG_TEMPLATE_TYPESCRIPT = `\
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
`

const ESLINT_CONFIG_TEMPLATE_JAVASCRIPT = `import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
`

function createFlatConfigFromLegacyJSON(
  legacyJson: any,
  isTypeScript: boolean
): string {
  const legacyLiteral = JSON.stringify(legacyJson, null, 2)
  return `import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const legacy = ${legacyLiteral};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"${isTypeScript ? ', "next/typescript"' : ''}),
  ...compat.config(legacy),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
`
}

function detectTypeScript(projectRoot: string): boolean {
  return existsSync(path.join(projectRoot, 'tsconfig.json'))
}

function findExistingEslintConfig(projectRoot: string): {
  exists: boolean
  path?: string
  isFlat?: boolean
} {
  const flatConfigs = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    'eslint.config.ts',
    'eslint.config.mts',
    'eslint.config.cts',
  ]

  const legacyConfigs = [
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    '.eslintrc.json',
    '.eslintrc',
  ]

  // Check for flat configs first (preferred for v9+)
  for (const config of flatConfigs) {
    const configPath = path.join(projectRoot, config)
    if (existsSync(configPath)) {
      return { exists: true, path: configPath, isFlat: true }
    }
  }

  // Check for legacy configs
  for (const config of legacyConfigs) {
    const configPath = path.join(projectRoot, config)
    if (existsSync(configPath)) {
      return { exists: true, path: configPath, isFlat: false }
    }
  }

  return { exists: false }
}

function updateExistingFlatConfig(
  configPath: string,
  isTypeScriptProject: boolean
): boolean {
  let configContent: string
  try {
    configContent = readFileSync(configPath, 'utf8')
  } catch (error) {
    console.error(`   Error reading config file: ${error}`)
    return false
  }

  if (/(\.ts|\.mts|\.cts)$/.test(configPath)) {
    console.warn(
      prefixes.warn,
      '   TypeScript config files require manual migration'
    )
    console.log('   Please add the following to your config:')
    console.log('   - Import: import { FlatCompat } from "@eslint/eslintrc"')
    console.log(
      '   - Extend: ...compat.extends("next/core-web-vitals"' +
        (isTypeScriptProject ? ', "next/typescript"' : '') +
        ')'
    )
    return false
  }

  const j = createParserFromPath(configPath)
  const root = j(configContent)

  const detectModuleKind = (): 'cjs' | 'esm' => {
    if (configPath.endsWith('.cjs')) return 'cjs'
    if (configPath.endsWith('.mjs')) return 'esm'
    // Heuristic for .js files
    const hasESM =
      root.find(j.ExportDefaultDeclaration).size() > 0 ||
      root.find(j.ImportDeclaration).size() > 0
    const hasCJS =
      root
        .find(j.AssignmentExpression, {
          left: {
            type: 'MemberExpression',
            object: { name: 'module' },
            property: { name: 'exports' },
          },
        })
        .size() > 0
    if (hasESM && !hasCJS) return 'esm'
    if (hasCJS && !hasESM) return 'cjs'
    return 'cjs'
  }

  const moduleKind = detectModuleKind()

  const getExportedArray = () => {
    if (moduleKind === 'cjs') {
      // Handle: module.exports = [ ... ]
      const directArray = root.find(j.AssignmentExpression, {
        left: {
          type: 'MemberExpression',
          object: { name: 'module' },
          property: { name: 'exports' },
        },
        right: { type: 'ArrayExpression' },
      })
      if (directArray.size() > 0) return directArray.at(0).get('right')

      // Handle: const eslintConfig = [ ... ]; module.exports = eslintConfig
      const exportedIdent = root.find(j.AssignmentExpression, {
        left: {
          type: 'MemberExpression',
          object: { name: 'module' },
          property: { name: 'exports' },
        },
        right: { type: 'Identifier' },
      })
      if (exportedIdent.size() > 0) {
        const name = exportedIdent.at(0).get('right').value.name
        const decl = root.find(j.VariableDeclarator, {
          id: { name },
          init: { type: 'ArrayExpression' },
        })
        if (decl.size() > 0) return decl.at(0).get('init')
      }
      return null
    }

    const direct = root.find(j.ExportDefaultDeclaration, {
      declaration: { type: 'ArrayExpression' },
    })
    if (direct.size() > 0) return direct.at(0).get('declaration')

    const ident = root.find(j.ExportDefaultDeclaration, {
      declaration: { type: 'Identifier' },
    })
    if (ident.size() > 0) {
      const name = ident.at(0).get('declaration').value.name
      const decl = root.find(j.VariableDeclarator, {
        id: { name },
        init: { type: 'ArrayExpression' },
      })
      if (decl.size() > 0) return decl.at(0).get('init')
    }
    return null
  }

  const exportedArray: any = getExportedArray()
  if (!exportedArray) {
    console.warn(
      prefixes.warn,
      '   Config does not export an array. Manual migration required.'
    )
    console.warn(
      prefixes.warn,
      '   ESLint flat configs must export an array of configuration objects.'
    )
    return false
  }

  const hasNextAlready =
    configContent.includes('next/core-web-vitals') ||
    configContent.includes('next/typescript')

  const ensureCompat = () => {
    const hasCompat =
      (moduleKind === 'cjs'
        ? root
            .find(j.CallExpression, {
              callee: { name: 'require' },
              arguments: [{ value: '@eslint/eslintrc' }],
            })
            .size() > 0
        : root
            .find(j.ImportDeclaration, {
              source: { value: '@eslint/eslintrc' },
            })
            .size() > 0) || configContent.includes('new FlatCompat(')

    if (hasCompat) return

    if (moduleKind === 'cjs') {
      const firstNode = root.find(j.Program).get('body', 0)
      const compatRequire = j.variableDeclaration('const', [
        j.variableDeclarator(
          j.objectPattern([
            j.property(
              'init',
              j.identifier('FlatCompat'),
              j.identifier('FlatCompat')
            ),
          ]),
          j.callExpression(j.identifier('require'), [
            j.literal('@eslint/eslintrc'),
          ])
        ),
      ])
      const compatNew = j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('compat'),
          j.newExpression(j.identifier('FlatCompat'), [
            j.objectExpression([
              j.property(
                'init',
                j.identifier('baseDirectory'),
                j.identifier('__dirname')
              ),
            ]),
          ])
        ),
      ])
      j(firstNode).insertBefore(compatRequire)
      j(firstNode).insertBefore(compatNew)
      return
    }

    const firstImport = root.find(j.ImportDeclaration).at(0)
    const insertPoint =
      firstImport.size() > 0 ? firstImport : root.find(j.Program).get('body', 0)
    const imports = [
      j.importDeclaration(
        [j.importSpecifier(j.identifier('dirname'))],
        j.literal('path')
      ),
      j.importDeclaration(
        [j.importSpecifier(j.identifier('fileURLToPath'))],
        j.literal('url')
      ),
      j.importDeclaration(
        [j.importSpecifier(j.identifier('FlatCompat'))],
        j.literal('@eslint/eslintrc')
      ),
    ]
    const setupVars = [
      j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('__filename'),
          j.callExpression(j.identifier('fileURLToPath'), [
            j.memberExpression(
              j.memberExpression(j.identifier('import'), j.identifier('meta')),
              j.identifier('url')
            ),
          ])
        ),
      ]),
      j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('__dirname'),
          j.callExpression(j.identifier('dirname'), [
            j.identifier('__filename'),
          ])
        ),
      ]),
      j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('compat'),
          j.newExpression(j.identifier('FlatCompat'), [
            j.objectExpression([
              j.property(
                'init',
                j.identifier('baseDirectory'),
                j.identifier('__dirname')
              ),
            ]),
          ])
        ),
      ]),
    ]
    imports.forEach((imp) => j(insertPoint).insertBefore(imp))
    setupVars.forEach((v) => j(insertPoint).insertBefore(v))
  }

  ensureCompat()

  // Add Next extends if missing
  if (!hasNextAlready) {
    const nextExtends = isTypeScriptProject
      ? ['next/core-web-vitals', 'next/typescript']
      : ['next/core-web-vitals']
    const spreadElement = j.spreadElement(
      j.callExpression(
        j.memberExpression(j.identifier('compat'), j.identifier('extends')),
        nextExtends.map((ext) => j.literal(ext))
      )
    )
    exportedArray.value.elements = exportedArray.value.elements || []
    exportedArray.value.elements.unshift(spreadElement)
  }

  // Ensure ignores
  const nextIgnores = [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]

  const findIgnoresObjectIndex = (): number => {
    const elements: any[] = exportedArray.value.elements || []
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      if (
        el &&
        el.type === 'ObjectExpression' &&
        el.properties?.some(
          (p: any) =>
            p.type === 'Property' &&
            p.key?.type === 'Identifier' &&
            p.key.name === 'ignores'
        )
      ) {
        return i
      }
    }
    return -1
  }

  const createIgnoresObject = () =>
    j.objectExpression([
      j.property(
        'init',
        j.identifier('ignores'),
        j.arrayExpression(nextIgnores.map((s) => j.literal(s)))
      ),
    ])

  const idx = findIgnoresObjectIndex()
  if (idx === -1) {
    // Put ignores after extends if we added it, otherwise at start
    const insertIndex = hasNextAlready ? 0 : 1
    exportedArray.value.elements.splice(insertIndex, 0, createIgnoresObject())
  } else {
    const obj: any = exportedArray.value.elements[idx]
    const ignoresProp: any = obj.properties.find(
      (p: any) =>
        p.type === 'Property' &&
        p.key?.type === 'Identifier' &&
        p.key.name === 'ignores'
    )
    if (ignoresProp?.value?.type === 'ArrayExpression') {
      const existing = new Set(
        ignoresProp.value.elements
          .map((el: any) => (el?.type === 'Literal' ? String(el.value) : null))
          .filter(Boolean)
      )
      nextIgnores.forEach((s) => {
        if (!existing.has(s)) ignoresProp.value.elements.push(j.literal(s))
      })
    }
  }

  const updated = root.toSource()
  if (updated === configContent) {
    if (hasNextAlready) {
      console.log('   Next.js ESLint configs already present in flat config')
      return true
    }
    return false
  }

  try {
    writeFileSync(configPath, updated)
  } catch (error) {
    console.error(`   Error writing config file: ${error}`)
    return false
  }

  if (hasNextAlready) {
    console.log(
      `   Updated ${path.basename(configPath)} with Next.js ignores configuration`
    )
  } else {
    console.log(
      `   Updated ${path.basename(configPath)} with Next.js ESLint configs`
    )
  }
  return true
}

function updatePackageJsonScripts(packageJsonContent: string): {
  updated: boolean
  content: string
} {
  try {
    const packageJson = JSON.parse(packageJsonContent)
    let needsUpdate = false

    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }

    // Process all scripts that contain "next lint"
    for (const scriptName in packageJson.scripts) {
      const scriptValue = packageJson.scripts[scriptName]
      if (
        typeof scriptValue === 'string' &&
        scriptValue.includes('next lint')
      ) {
        // Replace "next lint" with "eslint" and handle special arguments
        const updatedScript = scriptValue.replace(
          /\bnext\s+lint\b([^&|;]*)/gi,
          (_match, args = '') => {
            // Track whether we need a trailing space before operators
            let trailingSpace = ''
            if (args.endsWith(' ')) {
              trailingSpace = ' '
              args = args.trimEnd()
            }

            // Check for redirects (2>, 1>, etc.) and preserve them
            let redirect = ''
            const redirectMatch = args.match(/\s+(\d*>[>&]?.*)$/)
            if (redirectMatch) {
              redirect = ` ${redirectMatch[1]}`
              args = args.substring(0, redirectMatch.index)
            }

            // Parse arguments - handle quoted strings properly
            const argTokens = []
            let current = ''
            let inQuotes = false
            let quoteChar = ''

            for (let j = 0; j < args.length; j++) {
              const char = args[j]
              if (
                (char === '"' || char === "'") &&
                (j === 0 || args[j - 1] !== '\\')
              ) {
                if (!inQuotes) {
                  inQuotes = true
                  quoteChar = char
                  current += char
                } else if (char === quoteChar) {
                  inQuotes = false
                  quoteChar = ''
                  current += char
                } else {
                  current += char
                }
              } else if (char === ' ' && !inQuotes) {
                if (current) {
                  argTokens.push(current)
                  current = ''
                }
              } else {
                current += char
              }
            }
            if (current) {
              argTokens.push(current)
            }

            const eslintArgs = []
            const paths = []

            for (let i = 0; i < argTokens.length; i++) {
              const token = argTokens[i]

              if (token === '--strict') {
                eslintArgs.push('--max-warnings', '0')
              } else if (token === '--dir' && i + 1 < argTokens.length) {
                paths.push(argTokens[++i])
              } else if (token === '--file' && i + 1 < argTokens.length) {
                paths.push(argTokens[++i])
              } else if (token === '--rulesdir' && i + 1 < argTokens.length) {
                // Skip rulesdir and its value
                i++
              } else if (token === '--ext' && i + 1 < argTokens.length) {
                // Skip ext and its value
                i++
              } else if (token.startsWith('--')) {
                // Keep other flags and their values
                eslintArgs.push(token)
                if (
                  i + 1 < argTokens.length &&
                  !argTokens[i + 1].startsWith('--')
                ) {
                  eslintArgs.push(argTokens[++i])
                }
              } else {
                // Positional arguments (paths)
                paths.push(token)
              }
            }

            // Build the result
            let result = 'eslint'
            if (eslintArgs.length > 0) {
              result += ` ${eslintArgs.join(' ')}`
            }

            // Add paths or default to .
            if (paths.length > 0) {
              result += ` ${paths.join(' ')}`
            } else {
              result += ' .'
            }

            // Add redirect if present
            result += redirect

            // Add back trailing space if we had one
            result += trailingSpace

            return result
          }
        )

        if (updatedScript !== scriptValue) {
          packageJson.scripts[scriptName] = updatedScript
          needsUpdate = true
          console.log(
            `   Updated script "${scriptName}": "${scriptValue}" → "${updatedScript}"`
          )

          // Note about unsupported flags
          if (scriptValue.includes('--rulesdir')) {
            console.log(`   Note: --rulesdir is not supported in ESLint v9`)
          }
          if (scriptValue.includes('--ext')) {
            console.log(`   Note: --ext is not needed in ESLint v9 flat config`)
          }
        }
      }
    }

    // Ensure required devDependencies exist and upgrade if needed
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {}
    }

    const normalizeVersion = (
      version: string | undefined
    ): string | undefined => {
      if (!version) return undefined
      // Strip workspace, link, file references
      if (/^(workspace:|link:|file:)/.test(version)) return undefined
      // Extract first numeric version
      const m = version.match(/(\d+)\.(\d+)\.(\d+)/)
      return m ? m[0] : undefined
    }

    const majorOf = (version: string | undefined): number | undefined => {
      if (!version) return undefined
      const clean = normalizeVersion(version)
      if (!clean) return undefined
      const major = parseInt(clean.split('.')[0], 10)
      return Number.isFinite(major) ? major : undefined
    }

    // ESLint v9 is required for flat config by default
    const currentEslintVersion =
      packageJson.devDependencies.eslint || packageJson.dependencies?.eslint
    const currentMajor = majorOf(currentEslintVersion)
    if (!currentMajor || currentMajor < 9) {
      packageJson.devDependencies.eslint = '^9'
      needsUpdate = true
    }

    // Check if eslint-config-next exists in either dependencies or devDependencies
    if (
      !packageJson.devDependencies['eslint-config-next'] &&
      !packageJson.dependencies?.['eslint-config-next']
    ) {
      // Use the same version as next if available
      const nextVersion =
        packageJson.dependencies?.next || packageJson.devDependencies?.next
      packageJson.devDependencies['eslint-config-next'] =
        nextVersion || 'latest'
      needsUpdate = true
    }

    // Check if @eslint/eslintrc exists in either dependencies or devDependencies
    if (
      !packageJson.devDependencies['@eslint/eslintrc'] &&
      !packageJson.dependencies?.['@eslint/eslintrc']
    ) {
      packageJson.devDependencies['@eslint/eslintrc'] = '^3'
      needsUpdate = true
    }

    const updatedContent = `${JSON.stringify(packageJson, null, 2)}\n`
    return { updated: needsUpdate, content: updatedContent }
  } catch (error) {
    console.error('Error updating package.json:', error)
    return { updated: false, content: packageJsonContent }
  }
}

export default function transformer(
  files: string[],
  options: TransformerOptions = {}
): void {
  // The codemod CLI passes arguments as an array for consistency with file-based transforms,
  // but project-level transforms like this one only process a single directory.
  // Usage: npx @next/codemod next-lint-to-eslint-cli <project-directory>
  const dir = files[0]
  if (!dir) {
    console.error('Error: Please specify a directory path')
    return
  }

  // Allow skipping installation via option
  const skipInstall = options.skipInstall === true

  const projectRoot = path.resolve(dir)
  const packageJsonPath = path.join(projectRoot, 'package.json')

  if (!existsSync(packageJsonPath)) {
    console.error('Error: package.json not found in the specified directory')
    return
  }

  const isTypeScript = detectTypeScript(projectRoot)

  console.log('Migrating from next lint to the ESLint CLI...')

  // Ensure flat config exists or gets updated/migrated
  const ensureFlatConfig = (): void => {
    const existingConfig = findExistingEslintConfig(projectRoot)

    if (!existingConfig.exists) {
      const eslintConfigPath = path.join(projectRoot, 'eslint.config.mjs')
      const template = isTypeScript
        ? ESLINT_CONFIG_TEMPLATE_TYPESCRIPT
        : ESLINT_CONFIG_TEMPLATE_JAVASCRIPT
      try {
        writeFileSync(eslintConfigPath, template)
        console.log(`   Created ${path.basename(eslintConfigPath)}`)
      } catch (error) {
        console.error('   Error creating ESLint config:', error)
      }
      return
    }

    if (existingConfig.isFlat && existingConfig.path) {
      console.log(
        `   Found existing flat config: ${path.basename(existingConfig.path)}`
      )
      const updated = updateExistingFlatConfig(
        existingConfig.path,
        isTypeScript
      )
      if (!updated) {
        console.log(
          '   Could not automatically update the existing flat config.'
        )
        console.log(
          '   Please manually ensure your ESLint config extends "next/core-web-vitals"'
        )
        if (isTypeScript) {
          console.log('   and "next/typescript" for TypeScript projects.')
        }
      }
      return
    }

    if (!existingConfig.isFlat && existingConfig.path) {
      // Reuse the legacy migration logic inline to avoid duplication
      try {
        const raw = readFileSync(existingConfig.path, 'utf8')
        let legacyJson: any | null = null
        try {
          legacyJson = JSON.parse(raw)
        } catch {}
        const eslintConfigPath = path.join(projectRoot, 'eslint.config.mjs')
        if (legacyJson) {
          const output = createFlatConfigFromLegacyJSON(
            legacyJson,
            isTypeScript
          )
          writeFileSync(eslintConfigPath, output)
          console.log(
            `   Created ${path.basename(eslintConfigPath)} from legacy config`
          )
        } else {
          const template = isTypeScript
            ? ESLINT_CONFIG_TEMPLATE_TYPESCRIPT
            : ESLINT_CONFIG_TEMPLATE_JAVASCRIPT
          writeFileSync(eslintConfigPath, template)
          console.warn(
            prefixes.warn,
            '   Could not parse legacy config as JSON. Created default flat config.'
          )
          console.warn(
            prefixes.warn,
            '   Please manually merge your legacy rules into the new flat config.'
          )
        }
      } catch (e) {
        console.error('   Error migrating legacy ESLint config:', e)
        try {
          const eslintConfigPath = path.join(projectRoot, 'eslint.config.mjs')
          const template = isTypeScript
            ? ESLINT_CONFIG_TEMPLATE_TYPESCRIPT
            : ESLINT_CONFIG_TEMPLATE_JAVASCRIPT
          writeFileSync(eslintConfigPath, template)
          console.warn(
            prefixes.warn,
            '   Wrote default flat config because migration failed. Please merge manually.'
          )
        } catch (writeErr) {
          console.error('   Failed to write default flat config:', writeErr)
        }
      }
    }
  }

  // defer calling until after helpers are defined

  // Update package.json and install any new dev deps
  const applyPackageUpdates = (): void => {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8')
    const result = updatePackageJsonScripts(packageJsonContent)

    if (!result.updated) return

    try {
      writeFileSync(packageJsonPath, result.content)
      console.log('Updated package.json scripts and dependencies')

      const updatedPackageJson = JSON.parse(result.content)
      const originalPackageJson = JSON.parse(packageJsonContent)
      const newDependencies: string[] = []
      if (updatedPackageJson.devDependencies) {
        for (const [pkg, version] of Object.entries(
          updatedPackageJson.devDependencies
        )) {
          if (
            !originalPackageJson.devDependencies?.[pkg] &&
            !originalPackageJson.dependencies?.[pkg]
          ) {
            newDependencies.push(`${pkg}@${version}`)
          }
        }
      }

      if (newDependencies.length === 0) return

      if (skipInstall) {
        console.log('\nNew dependencies added to package.json:')
        newDependencies.forEach((dep) => console.log(`   - ${dep}`))
        console.log(`Please run: ${getPkgManager(projectRoot)} install`)
        return
      }

      console.log('\nInstalling new dependencies...')
      try {
        const packageManager = getPkgManager(projectRoot)
        console.log(`   Using ${packageManager}...`)
        installPackages(newDependencies, {
          packageManager,
          dev: true,
          silent: false,
          cwd: projectRoot,
        })
        console.log('   Dependencies installed successfully!')
      } catch (_error) {
        console.error('   Failed to install dependencies automatically.')
        console.error(`   Please run: ${getPkgManager(projectRoot)} install`)
      }
    } catch (error) {
      console.error('Error writing package.json:', error)
    }
  }

  ensureFlatConfig()
  applyPackageUpdates()

  console.log('\nMigration complete! Your project now uses the ESLint CLI.')
}
