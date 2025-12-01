import type { PropsTypeInfo, JsxLocation } from './type-resolver'
import { resolvePropsType } from './type-resolver'
import type ts from 'typescript/lib/tsserverlibrary'
import {
  generateSensitiveDataPrompt,
  generateNonSerializablePrompt,
} from './expert-prompts'

export interface AnalyzedBoundary {
  id: string
  serverFile: string
  clientFile: string
  localName: string
  propsType: PropsTypeInfo | null
  analysisError: string | null
  jsxLocation?: JsxLocation
}

export interface BoundaryWithLocation {
  id: string
  serverFile: string
  clientFile: string
  importInfo: {
    localName: string
  }
  jsxLocation?: JsxLocation
}

/**
 * Analyzes boundaries and resolves TypeScript types for props.
 */
export async function analyzeBoundaries(
  typescript: typeof ts,
  projectPath: string,
  boundaries: BoundaryWithLocation[]
): Promise<AnalyzedBoundary[]> {
  const results: AnalyzedBoundary[] = []

  for (const boundary of boundaries) {
    let propsType: PropsTypeInfo | null = null
    let analysisError: string | null = null

    if (boundary.jsxLocation) {
      try {
        propsType = await resolvePropsType(
          typescript,
          projectPath,
          boundary.jsxLocation
        )
      } catch (error) {
        analysisError = error instanceof Error ? error.message : String(error)
      }
    } else {
      analysisError = 'No JSX location available'
    }

    results.push({
      id: boundary.id,
      serverFile: boundary.serverFile,
      clientFile: boundary.clientFile,
      localName: boundary.importInfo.localName,
      propsType,
      analysisError,
      jsxLocation: boundary.jsxLocation,
    })
  }

  return results
}

/**
 * Formats analyzed boundaries for console output.
 */
export function formatBoundaryAnalysis(analyzed: AnalyzedBoundary[]): string {
  const lines: string[] = []

  lines.push('\n=== Server→Client Boundary Type Analysis ===')
  lines.push(`Total boundaries: ${analyzed.length}`)
  lines.push('')

  for (const boundary of analyzed) {
    lines.push(`Boundary: ${boundary.serverFile}`)
    lines.push(`  → Client Component: ${boundary.clientFile}`)
    lines.push(`  → Import Name: ${boundary.localName}`)

    if (boundary.propsType) {
      lines.push(`  → Props Type: ${boundary.propsType.typeString}`)
      lines.push(
        `  → Props: ${boundary.propsType.propNames.join(', ') || '(none)'}`
      )

      const flags = boundary.propsType.sensitiveFlags
      const sensitiveWarnings: string[] = []

      if (
        flags.hasPassword &&
        boundary.propsType.sensitiveProps.password.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.password
          .map((p) => boundary.propsType!.sensitiveSource[p] || p)
          .join(', ')
        sensitiveWarnings.push(`PASSWORD (${propDetails})`)
      }
      if (
        flags.hasSecret &&
        boundary.propsType.sensitiveProps.secret.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.secret
          .map((p) => boundary.propsType!.sensitiveSource[p] || p)
          .join(', ')
        sensitiveWarnings.push(`SECRET (${propDetails})`)
      }
      if (
        flags.hasToken &&
        boundary.propsType.sensitiveProps.token.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.token
          .map((p) => boundary.propsType!.sensitiveSource[p] || p)
          .join(', ')
        sensitiveWarnings.push(`TOKEN (${propDetails})`)
      }
      if (
        flags.hasApiKey &&
        boundary.propsType.sensitiveProps.apiKey.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.apiKey
          .map((p) => boundary.propsType!.sensitiveSource[p] || p)
          .join(', ')
        sensitiveWarnings.push(`API_KEY (${propDetails})`)
      }
      if (
        flags.hasCredential &&
        boundary.propsType.sensitiveProps.credential.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.credential
          .map((p) => boundary.propsType!.sensitiveSource[p] || p)
          .join(', ')
        sensitiveWarnings.push(`CREDENTIAL (${propDetails})`)
      }

      const boundaryContext = {
        serverFile: boundary.serverFile,
        clientFile: boundary.clientFile,
        componentName: boundary.localName,
      }

      // Generate expert prompts for each type of detection
      if (sensitiveWarnings.length > 0) {
        lines.push(`  ⚠️  SENSITIVE DATA DETECTED:`)
        for (const warning of sensitiveWarnings) {
          lines.push(`     - ${warning}`)
        }
        lines.push('')

        // Generate a prompt for each sensitive data category
        if (
          flags.hasPassword &&
          boundary.propsType.sensitiveProps.password.length > 0
        ) {
          const prompt = generateSensitiveDataPrompt({
            category: 'PASSWORD',
            propPaths: boundary.propsType.sensitiveProps.password,
            propValues: boundary.propsType.sensitiveSource,
            boundaryContext,
          })
          lines.push(prompt)
        }

        if (
          flags.hasSecret &&
          boundary.propsType.sensitiveProps.secret.length > 0
        ) {
          const prompt = generateSensitiveDataPrompt({
            category: 'SECRET',
            propPaths: boundary.propsType.sensitiveProps.secret,
            propValues: boundary.propsType.sensitiveSource,
            boundaryContext,
          })
          lines.push(prompt)
        }

        if (
          flags.hasToken &&
          boundary.propsType.sensitiveProps.token.length > 0
        ) {
          const prompt = generateSensitiveDataPrompt({
            category: 'TOKEN',
            propPaths: boundary.propsType.sensitiveProps.token,
            propValues: boundary.propsType.sensitiveSource,
            boundaryContext,
          })
          lines.push(prompt)
        }

        if (
          flags.hasApiKey &&
          boundary.propsType.sensitiveProps.apiKey.length > 0
        ) {
          const prompt = generateSensitiveDataPrompt({
            category: 'API_KEY',
            propPaths: boundary.propsType.sensitiveProps.apiKey,
            propValues: boundary.propsType.sensitiveSource,
            boundaryContext,
          })
          lines.push(prompt)
        }

        if (
          flags.hasCredential &&
          boundary.propsType.sensitiveProps.credential.length > 0
        ) {
          const prompt = generateSensitiveDataPrompt({
            category: 'CREDENTIAL',
            propPaths: boundary.propsType.sensitiveProps.credential,
            propValues: boundary.propsType.sensitiveSource,
            boundaryContext,
          })
          lines.push(prompt)
        }
      }

      if (
        boundary.propsType.functionProps &&
        boundary.propsType.functionProps.length > 0
      ) {
        lines.push(`  ⚠️  NON-SERIALIZABLE PROPS DETECTED:`)
        for (const funcProp of boundary.propsType.functionProps) {
          const value = boundary.propsType.propValues[funcProp]
          const propDetail = value ? `${funcProp} = {${value}}` : funcProp
          lines.push(`     - ${propDetail} (function type)`)
        }
        lines.push('')

        // Generate expert prompt for non-serializable props
        const prompt = generateNonSerializablePrompt({
          functionProps: boundary.propsType.functionProps,
          propValues: boundary.propsType.propValues,
          boundaryContext,
        })
        lines.push(prompt)
      }
    } else if (boundary.analysisError) {
      lines.push(`  ⚠️  Type analysis failed: ${boundary.analysisError}`)
    }

    lines.push('')
  }

  lines.push('==========================================\n')

  return lines.join('\n')
}

/**
 * Converts analyzed boundaries to BoundaryInsights for DevTools panel display.
 */
export function toBoundaryInsights(analyzed: AnalyzedBoundary[]): Array<{
  id: string
  serverFile: string
  clientFile: string
  localName: string
  warnings: Array<{
    category: 'sensitive-data' | 'non-serializable'
    severity: 'warning' | 'error'
    propName: string
    propPath: string
    message: string
  }>
  jsxLocation?: {
    line: number
    column: number
  }
}> {
  return analyzed
    .map((boundary) => {
      if (!boundary.propsType) return null

      const warnings: Array<{
        category: 'sensitive-data' | 'non-serializable'
        severity: 'warning' | 'error'
        propName: string
        propPath: string
        message: string
      }> = []

      // Collect sensitive data warnings
      const flags = boundary.propsType.sensitiveFlags

      if (flags.hasPassword) {
        for (const propName of boundary.propsType.sensitiveProps.password) {
          warnings.push({
            category: 'sensitive-data',
            severity: 'warning',
            propName,
            propPath: boundary.propsType.sensitiveSource[propName] || propName,
            message: `Password data is being passed to a client component`,
          })
        }
      }

      if (flags.hasSecret) {
        for (const propName of boundary.propsType.sensitiveProps.secret) {
          warnings.push({
            category: 'sensitive-data',
            severity: 'warning',
            propName,
            propPath: boundary.propsType.sensitiveSource[propName] || propName,
            message: `Secret data is being passed to a client component`,
          })
        }
      }

      if (flags.hasToken) {
        for (const propName of boundary.propsType.sensitiveProps.token) {
          warnings.push({
            category: 'sensitive-data',
            severity: 'warning',
            propName,
            propPath: boundary.propsType.sensitiveSource[propName] || propName,
            message: `Token data is being passed to a client component`,
          })
        }
      }

      if (flags.hasApiKey) {
        for (const propName of boundary.propsType.sensitiveProps.apiKey) {
          warnings.push({
            category: 'sensitive-data',
            severity: 'warning',
            propName,
            propPath: boundary.propsType.sensitiveSource[propName] || propName,
            message: `API key is being passed to a client component`,
          })
        }
      }

      if (flags.hasCredential) {
        for (const propName of boundary.propsType.sensitiveProps.credential) {
          warnings.push({
            category: 'sensitive-data',
            severity: 'warning',
            propName,
            propPath: boundary.propsType.sensitiveSource[propName] || propName,
            message: `Credential data is being passed to a client component`,
          })
        }
      }

      // Collect non-serializable warnings
      if (
        boundary.propsType.functionProps &&
        boundary.propsType.functionProps.length > 0
      ) {
        for (const funcProp of boundary.propsType.functionProps) {
          const value = boundary.propsType.propValues[funcProp]
          warnings.push({
            category: 'non-serializable',
            severity: 'warning',
            propName: funcProp,
            propPath: value ? `${funcProp} = {${value}}` : funcProp,
            message: `Function is being passed to a client component (not a Server Action)`,
          })
        }
      }

      if (warnings.length === 0) return null

      return {
        id: boundary.id,
        serverFile: boundary.serverFile,
        clientFile: boundary.clientFile,
        localName: boundary.localName,
        warnings,
        jsxLocation: boundary.jsxLocation
          ? {
              line: boundary.jsxLocation.line,
              column: boundary.jsxLocation.column,
            }
          : undefined,
      }
    })
    .filter(
      (insight): insight is NonNullable<typeof insight> => insight !== null
    )
}
