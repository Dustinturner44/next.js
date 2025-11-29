import type ts from 'typescript/lib/tsserverlibrary'

export interface PropsTypeInfo {
  /**
   * The TypeScript type string (e.g., "{ name: string; age: number }")
   */
  typeString: string

  /**
   * List of prop names extracted from the type
   */
  propNames: string[]

  /**
   * Flags indicating potentially sensitive data patterns
   */
  sensitiveFlags: {
    hasPassword: boolean
    hasSecret: boolean
    hasToken: boolean
    hasApiKey: boolean
    hasCredential: boolean
  }

  /**
   * Specific prop names that matched sensitive patterns
   */
  sensitiveProps: {
    password: string[]
    secret: string[]
    token: string[]
    apiKey: string[]
    credential: string[]
  }

  /**
   * Map of prop names to their actual JSX attribute values (source code)
   */
  propValues: Record<string, string>

  /**
   * Map tracking the source of each sensitive detection
   * Key: full path like "credentials.password"
   * Value: source expression like "(z=user).credentials.password" or "y=user.credentials.password"
   */
  sensitiveSource: Record<string, string>
}

export interface JsxLocation {
  file: string
  line: number
  column: number
  spanStart: number
  spanEnd: number
}

/**
 * Resolves the props type for a JSX element at a specific location.
 *
 * @param typescript - TypeScript module instance
 * @param projectPath - Root path of the Next.js project
 * @param jsxLocation - Location of the JSX element
 * @returns Props type information, or null if unable to resolve
 */
export async function resolvePropsType(
  typescript: typeof ts,
  projectPath: string,
  jsxLocation: JsxLocation
): Promise<PropsTypeInfo | null> {
  try {
    // Find tsconfig.json
    const configPath = typescript.findConfigFile(
      projectPath,
      typescript.sys.fileExists,
      'tsconfig.json'
    )

    if (!configPath) {
      console.log('[TYPE_RESOLVER] No tsconfig.json found')
      return null
    }

    // Read and parse config
    const configFile = typescript.readConfigFile(
      configPath,
      typescript.sys.readFile
    )

    if (configFile.error) {
      console.log('[TYPE_RESOLVER] Error reading tsconfig:', configFile.error)
      return null
    }

    const parsedConfig = typescript.parseJsonConfigFileContent(
      configFile.config,
      typescript.sys,
      projectPath
    )

    // Create program
    const program = typescript.createProgram({
      rootNames: parsedConfig.fileNames,
      options: parsedConfig.options,
    })

    const typeChecker = program.getTypeChecker()
    const sourceFile = program.getSourceFile(jsxLocation.file)

    if (!sourceFile) {
      console.log('[TYPE_RESOLVER] Source file not found:', jsxLocation.file)
      return null
    }

    // Find the node at the JSX location
    const position = typescript.getPositionOfLineAndCharacter(
      sourceFile,
      jsxLocation.line - 1, // Convert to 0-indexed
      jsxLocation.column
    )

    const node = findNodeAtPosition(sourceFile, position, typescript)
    if (!node) {
      console.log('[TYPE_RESOLVER] No node found at position')
      return null
    }

    // Walk up to find JSX element
    const jsxElement = findJsxElement(node, typescript)
    if (!jsxElement) {
      console.log('[TYPE_RESOLVER] No JSX element found')
      return null
    }

    // Get the opening element
    const openingElement = typescript.isJsxElement(jsxElement)
      ? jsxElement.openingElement
      : jsxElement

    // Analyze the types of the actual expressions being passed as props
    const attributes = openingElement.attributes.properties
    const propNames: string[] = []
    const propValues: Record<string, string> = {}
    const sensitiveSource: Record<string, string> = {}
    const typeParts: string[] = []

    const sensitivePatterns = {
      password: /password|pwd|passwd/i,
      secret: /secret|private/i,
      token: /token|jwt|bearer/i,
      apiKey: /apikey|api_key|key/i,
      credential: /credential|auth|authentication/i,
    }

    const sensitiveFlags = {
      hasPassword: false,
      hasSecret: false,
      hasToken: false,
      hasApiKey: false,
      hasCredential: false,
    }

    const sensitiveProps = {
      password: [] as string[],
      secret: [] as string[],
      token: [] as string[],
      apiKey: [] as string[],
      credential: [] as string[],
    }

    // Process each JSX attribute
    for (const attr of attributes) {
      if (typescript.isJsxAttribute(attr)) {
        const propName = attr.name.getText(sourceFile)
        propNames.push(propName)

        if (attr.initializer) {
          let expression: ts.Expression | undefined

          if (typescript.isJsxExpression(attr.initializer)) {
            expression = attr.initializer.expression
          } else if (typescript.isStringLiteral(attr.initializer)) {
            expression = attr.initializer
          }

          if (expression) {
            const exprText = expression.getText(sourceFile)
            propValues[propName] = exprText

            // Get the TYPE of the expression
            const exprType = typeChecker.getTypeAtLocation(expression)
            const typeStr = typeChecker.typeToString(exprType)
            typeParts.push(`${propName}: ${typeStr}`)

            console.log(`[TYPE_RESOLVER] Prop ${propName}: ${typeStr}`)

            // Check if type is a function
            const signatures = exprType.getCallSignatures()
            const isFunctionType = signatures.length > 0

            // Check if type is primitive
            const isPrimitive =
              (exprType.flags & typescript.TypeFlags.String) !== 0 ||
              (exprType.flags & typescript.TypeFlags.Number) !== 0 ||
              (exprType.flags & typescript.TypeFlags.Boolean) !== 0 ||
              (exprType.flags & typescript.TypeFlags.StringLiteral) !== 0 ||
              (exprType.flags & typescript.TypeFlags.NumberLiteral) !== 0 ||
              (exprType.flags & typescript.TypeFlags.BooleanLiteral) !== 0 ||
              (exprType.flags & typescript.TypeFlags.Null) !== 0 ||
              (exprType.flags & typescript.TypeFlags.Undefined) !== 0 ||
              (exprType.flags & typescript.TypeFlags.Void) !== 0 ||
              (exprType.flags & typescript.TypeFlags.Any) !== 0

            // Check if type is an object (not primitive, not function, has properties)
            const properties = exprType.getProperties()
            const isObjectType =
              !isPrimitive && !isFunctionType && properties.length > 0

            if (isFunctionType) {
              console.log(
                `[TYPE_RESOLVER] Warning: ${propName} is a function (non-serializable)`
              )
            } else if (isObjectType) {
              // OBJECT TYPE: Recursive type analysis
              // Source format: (propName=identifier).path
              let sourcePrefix = propName
              if (typescript.isIdentifier(expression)) {
                const identifier = exprText
                sourcePrefix = `(${propName}=${identifier})`
                console.log(
                  `[TYPE_RESOLVER] Object type - will recurse with source: ${sourcePrefix}`
                )
              }

              analyzePropType(
                propName,
                exprType,
                typeChecker,
                typescript,
                sensitivePatterns,
                sensitiveFlags,
                sensitiveProps,
                '',
                sourcePrefix,
                sensitiveSource
              )
            } else {
              // PRIMITIVE TYPE: Check identifier/property name
              if (typescript.isIdentifier(expression)) {
                // Simple identifier: x={apiKey}
                // Check identifier name, source: x=apiKey
                const identifier = exprText
                console.log(
                  `[TYPE_RESOLVER] Primitive with identifier: ${identifier}`
                )

                const matches = matchesSensitivePattern(
                  identifier,
                  sensitivePatterns
                )
                if (matches.length > 0) {
                  const source = `${propName}=${identifier}`
                  const fullPath = identifier

                  for (const matchType of matches) {
                    sensitiveFlags[
                      `has${matchType.charAt(0).toUpperCase() + matchType.slice(1)}` as keyof SensitiveFlags
                    ] = true
                    sensitiveProps[matchType].push(fullPath)
                  }

                  sensitiveSource[fullPath] = source
                  console.log(
                    `[TYPE_RESOLVER] Detected sensitive identifier: ${fullPath} from ${source}`
                  )
                }
              } else if (typescript.isPropertyAccessExpression(expression)) {
                // Property chain: y={user.credentials.password}
                // Check LAST property, source: y=user.credentials.password
                const lastProp = expression.name.getText(sourceFile)
                console.log(
                  `[TYPE_RESOLVER] Primitive with property chain, checking last prop: ${lastProp}`
                )

                const matches = matchesSensitivePattern(
                  lastProp,
                  sensitivePatterns
                )
                if (matches.length > 0) {
                  const source = `${propName}=${exprText}`
                  const fullPath = lastProp

                  for (const matchType of matches) {
                    sensitiveFlags[
                      `has${matchType.charAt(0).toUpperCase() + matchType.slice(1)}` as keyof SensitiveFlags
                    ] = true
                    sensitiveProps[matchType].push(fullPath)
                  }

                  sensitiveSource[fullPath] = source
                  console.log(
                    `[TYPE_RESOLVER] Detected sensitive property: ${fullPath} from ${source}`
                  )
                }
              }
            }
          }
        }
      } else if (typescript.isJsxSpreadAttribute(attr)) {
        // Handle spread attributes
        const spreadExpr = attr.expression
        const spreadText = spreadExpr.getText(sourceFile)
        propValues['...' + spreadText] = spreadText

        const spreadType = typeChecker.getTypeAtLocation(spreadExpr)
        const spreadProps = spreadType.getProperties()

        for (const spreadProp of spreadProps) {
          const spreadPropName = spreadProp.getName()
          propNames.push(spreadPropName)
          const spreadPropType = typeChecker.getTypeOfSymbolAtLocation(
            spreadProp,
            spreadExpr
          )

          analyzePropType(
            spreadPropName,
            spreadPropType,
            typeChecker,
            typescript,
            sensitivePatterns,
            sensitiveFlags,
            sensitiveProps,
            '',
            `(...${spreadText}).${spreadPropName}`,
            sensitiveSource
          )
        }
      }
    }

    return {
      typeString: `{ ${typeParts.join('; ')} }`,
      propNames,
      sensitiveFlags,
      sensitiveProps,
      propValues,
      sensitiveSource,
    }
  } catch (error) {
    console.log('[TYPE_RESOLVER] Error:', error)
    return null
  }
}

/**
 * Find the deepest node containing a position
 */
function findNodeAtPosition(
  node: ts.Node,
  position: number,
  typescript: typeof ts
): ts.Node | null {
  if (node.pos <= position && position < node.end) {
    const result = typescript.forEachChild(node, (childNode) => {
      const found = findNodeAtPosition(childNode, position, typescript)
      return found || undefined
    })
    return result || node
  }
  return null
}

/**
 * Walk up the AST to find a JSX element
 */
function findJsxElement(
  node: ts.Node,
  typescript: typeof ts
): ts.JsxElement | ts.JsxSelfClosingElement | null {
  if (
    typescript.isJsxElement(node) ||
    typescript.isJsxSelfClosingElement(node)
  ) {
    return node
  }
  return node.parent ? findJsxElement(node.parent, typescript) : null
}

interface SensitivePatterns {
  password: RegExp
  secret: RegExp
  token: RegExp
  apiKey: RegExp
  credential: RegExp
}

interface SensitiveFlags {
  hasPassword: boolean
  hasSecret: boolean
  hasToken: boolean
  hasApiKey: boolean
  hasCredential: boolean
}

interface SensitivePropsMap {
  password: string[]
  secret: string[]
  token: string[]
  apiKey: string[]
  credential: string[]
}

/**
 * Check if a name matches sensitive patterns
 */
function matchesSensitivePattern(
  name: string,
  patterns: SensitivePatterns
): Array<keyof SensitivePropsMap> {
  const matches: Array<keyof SensitivePropsMap> = []

  if (patterns.password.test(name)) matches.push('password')
  if (patterns.secret.test(name)) matches.push('secret')
  if (patterns.token.test(name)) matches.push('token')
  if (patterns.apiKey.test(name)) matches.push('apiKey')
  if (patterns.credential.test(name)) matches.push('credential')

  return matches
}

/**
 * Recursively analyze a prop's type for sensitive data patterns
 * @param sourcePrefix - Source expression like "(z=user)" or "y=user.credentials.password"
 */
function analyzePropType(
  propPath: string,
  propType: ts.Type,
  typeChecker: ts.TypeChecker,
  typescript: typeof ts,
  patterns: SensitivePatterns,
  flags: SensitiveFlags,
  propsMap: SensitivePropsMap,
  pathPrefix: string,
  sourcePrefix: string,
  sourceMap: Record<string, string>
): void {
  const fullPath = pathPrefix ? `${pathPrefix}.${propPath}` : propPath

  // Check if type is a function
  const signatures = propType.getCallSignatures()
  if (signatures.length > 0) {
    console.log(
      `[TYPE_RESOLVER] Warning: ${fullPath} is a function (non-serializable)`
    )
    return
  }

  // Check if type is primitive (string, number, boolean, etc.)
  const isPrimitive =
    (propType.flags & typescript.TypeFlags.String) !== 0 ||
    (propType.flags & typescript.TypeFlags.Number) !== 0 ||
    (propType.flags & typescript.TypeFlags.Boolean) !== 0 ||
    (propType.flags & typescript.TypeFlags.StringLiteral) !== 0 ||
    (propType.flags & typescript.TypeFlags.NumberLiteral) !== 0 ||
    (propType.flags & typescript.TypeFlags.BooleanLiteral) !== 0 ||
    (propType.flags & typescript.TypeFlags.Null) !== 0 ||
    (propType.flags & typescript.TypeFlags.Undefined) !== 0 ||
    (propType.flags & typescript.TypeFlags.Void) !== 0

  if (isPrimitive) {
    // For primitives, check the property name for sensitive patterns
    const matches = matchesSensitivePattern(propPath, patterns)

    if (matches.length > 0) {
      // Record the source for this detection
      // For fullPath like "z.credentials.password", extract the nested part after first dot
      const dotIndex = fullPath.indexOf('.')
      const sourcePath =
        dotIndex !== -1
          ? `${sourcePrefix}${fullPath.substring(dotIndex)}` // e.g., "(z=user).credentials.password"
          : `${sourcePrefix}.${propPath}` // e.g., "(x=apiKey).someField"

      // Add fullPath to each matched category
      for (const matchType of matches) {
        flags[
          `has${matchType.charAt(0).toUpperCase() + matchType.slice(1)}` as keyof SensitiveFlags
        ] = true
        propsMap[matchType].push(fullPath) // Store fullPath, not just propPath
      }

      sourceMap[fullPath] = sourcePath
      console.log(
        `[TYPE_RESOLVER] Detected sensitive: ${fullPath} from ${sourcePath}`
      )
    }
    return
  }

  // For objects, recursively analyze nested properties
  const properties = propType.getProperties()
  if (properties.length > 0) {
    console.log(
      `[TYPE_RESOLVER] Recursing into object ${fullPath} with ${properties.length} properties`
    )
    for (const nestedProp of properties) {
      const nestedName = nestedProp.getName()
      const nestedType = typeChecker.getTypeOfSymbolAtLocation(
        nestedProp,
        nestedProp.valueDeclaration || (nestedProp.declarations?.[0] as any)
      )

      // Recursively analyze nested property
      analyzePropType(
        nestedName,
        nestedType,
        typeChecker,
        typescript,
        patterns,
        flags,
        propsMap,
        fullPath,
        sourcePrefix,
        sourceMap
      )
    }
  }
}
