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

    // Check for sensitive patterns
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

    for (const propName of propNames) {
      if (sensitivePatterns.password.test(propName)) {
        sensitiveFlags.hasPassword = true
        sensitiveProps.password.push(propName)
      }
      if (sensitivePatterns.secret.test(propName)) {
        sensitiveFlags.hasSecret = true
        sensitiveProps.secret.push(propName)
      }
      if (sensitivePatterns.token.test(propName)) {
        sensitiveFlags.hasToken = true
        sensitiveProps.token.push(propName)
      }
      if (sensitivePatterns.apiKey.test(propName)) {
        sensitiveFlags.hasApiKey = true
        sensitiveProps.apiKey.push(propName)
      }
      if (sensitivePatterns.credential.test(propName)) {
        sensitiveFlags.hasCredential = true
        sensitiveProps.credential.push(propName)
      }
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
