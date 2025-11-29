import type { PropsTypeInfo, JsxLocation } from './type-resolver'
import { resolvePropsType } from './type-resolver'
import type ts from 'typescript/lib/tsserverlibrary'

export interface AnalyzedBoundary {
  id: string
  serverFile: string
  clientFile: string
  localName: string
  propsType: PropsTypeInfo | null
  analysisError: string | null
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
          .map((p) => {
            const value = boundary.propsType!.propValues[p]
            return value ? `${p} = {${value}}` : p
          })
          .join(', ')
        sensitiveWarnings.push(`PASSWORD (${propDetails})`)
      }
      if (
        flags.hasSecret &&
        boundary.propsType.sensitiveProps.secret.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.secret
          .map((p) => {
            const value = boundary.propsType!.propValues[p]
            return value ? `${p} = {${value}}` : p
          })
          .join(', ')
        sensitiveWarnings.push(`SECRET (${propDetails})`)
      }
      if (
        flags.hasToken &&
        boundary.propsType.sensitiveProps.token.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.token
          .map((p) => {
            const value = boundary.propsType!.propValues[p]
            return value ? `${p} = {${value}}` : p
          })
          .join(', ')
        sensitiveWarnings.push(`TOKEN (${propDetails})`)
      }
      if (
        flags.hasApiKey &&
        boundary.propsType.sensitiveProps.apiKey.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.apiKey
          .map((p) => {
            const value = boundary.propsType!.propValues[p]
            return value ? `${p} = {${value}}` : p
          })
          .join(', ')
        sensitiveWarnings.push(`API_KEY (${propDetails})`)
      }
      if (
        flags.hasCredential &&
        boundary.propsType.sensitiveProps.credential.length > 0
      ) {
        const propDetails = boundary.propsType.sensitiveProps.credential
          .map((p) => {
            const value = boundary.propsType!.propValues[p]
            return value ? `${p} = {${value}}` : p
          })
          .join(', ')
        sensitiveWarnings.push(`CREDENTIAL (${propDetails})`)
      }

      if (sensitiveWarnings.length > 0) {
        lines.push(`  ⚠️  SENSITIVE DATA DETECTED:`)
        for (const warning of sensitiveWarnings) {
          lines.push(`     - ${warning}`)
        }
      }
    } else if (boundary.analysisError) {
      lines.push(`  ⚠️  Type analysis failed: ${boundary.analysisError}`)
    }

    lines.push('')
  }

  lines.push('==========================================\n')

  return lines.join('\n')
}
