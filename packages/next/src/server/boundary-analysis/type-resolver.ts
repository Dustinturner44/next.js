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

    // Get the component type
    const openingElement = typescript.isJsxElement(jsxElement)
      ? jsxElement.openingElement
      : jsxElement

    const tagType = typeChecker.getTypeAtLocation(openingElement.tagName)

    // Get props type from component signature
    const propsType = getPropsType(tagType, typeChecker, openingElement)

    if (!propsType) {
      console.log('[TYPE_RESOLVER] Could not resolve props type')
      return null
    }

    // Extract JSX attribute values
    const propValues: Record<string, string> = {}
    const attributes = openingElement.attributes.properties

    for (const attr of attributes) {
      if (typescript.isJsxAttribute(attr)) {
        const propName = attr.name.getText(sourceFile)
        if (attr.initializer) {
          if (typescript.isJsxExpression(attr.initializer)) {
            // Get the expression inside {}
            const expression = attr.initializer.expression
            if (expression) {
              propValues[propName] = expression.getText(sourceFile)
            }
          } else if (typescript.isStringLiteral(attr.initializer)) {
            // String literal value
            propValues[propName] = attr.initializer.getText(sourceFile)
          }
        }
      } else if (typescript.isJsxSpreadAttribute(attr)) {
        // Handle spread attributes
        const spreadExpr = attr.expression.getText(sourceFile)
        propValues['...' + spreadExpr] = spreadExpr
      }
    }

    // Extract type string
    const typeString = typeChecker.typeToString(
      propsType,
      undefined,
      typescript.TypeFormatFlags.NoTruncation
    )

    // Get prop names
    const propNames: string[] = []
    const properties = propsType.getProperties()
    for (const prop of properties) {
      propNames.push(prop.getName())
    }

    // Analyze each prop's type recursively
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

    // Analyze each prop's type
    for (const prop of properties) {
      const propName = prop.getName()
      const propType = typeChecker.getTypeOfSymbolAtLocation(
        prop,
        openingElement
      )

      analyzePropType(
        propName,
        propType,
        typeChecker,
        typescript,
        sensitivePatterns,
        sensitiveFlags,
        sensitiveProps,
        '' // empty path prefix for top-level props
      )
    }

    return {
      typeString,
      propNames,
      sensitiveFlags,
      sensitiveProps,
      propValues,
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

/**
 * Extract props type from component type
 */
function getPropsType(
  componentType: ts.Type,
  typeChecker: ts.TypeChecker,
  openingElement: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): ts.Type | null {
  // Try call signatures (function components)
  const callSignatures = componentType.getCallSignatures()
  if (callSignatures.length > 0) {
    const firstParam = callSignatures[0].parameters[0]
    if (firstParam) {
      return typeChecker.getTypeOfSymbolAtLocation(firstParam, openingElement)
    }
  }

  // Try constructor signatures (class components)
  const constructSignatures = componentType.getConstructSignatures()
  if (constructSignatures.length > 0) {
    const firstParam = constructSignatures[0].parameters[0]
    if (firstParam) {
      return typeChecker.getTypeOfSymbolAtLocation(firstParam, openingElement)
    }
  }

  return null
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
 * Recursively analyze a prop's type for sensitive data patterns
 */
function analyzePropType(
  propPath: string,
  propType: ts.Type,
  typeChecker: ts.TypeChecker,
  typescript: typeof ts,
  patterns: SensitivePatterns,
  flags: SensitiveFlags,
  propsMap: SensitivePropsMap,
  pathPrefix: string
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
    if (patterns.password.test(propPath)) {
      flags.hasPassword = true
      propsMap.password.push(fullPath)
    }
    if (patterns.secret.test(propPath)) {
      flags.hasSecret = true
      propsMap.secret.push(fullPath)
    }
    if (patterns.token.test(propPath)) {
      flags.hasToken = true
      propsMap.token.push(fullPath)
    }
    if (patterns.apiKey.test(propPath)) {
      flags.hasApiKey = true
      propsMap.apiKey.push(fullPath)
    }
    if (patterns.credential.test(propPath)) {
      flags.hasCredential = true
      propsMap.credential.push(fullPath)
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
        fullPath
      )
    }
  }
}
