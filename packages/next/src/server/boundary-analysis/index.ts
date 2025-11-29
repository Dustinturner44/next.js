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
      const sensitiveProps: string[] = []
      if (flags.hasPassword) sensitiveProps.push('PASSWORD')
      if (flags.hasSecret) sensitiveProps.push('SECRET')
      if (flags.hasToken) sensitiveProps.push('TOKEN')
      if (flags.hasApiKey) sensitiveProps.push('API_KEY')
      if (flags.hasCredential) sensitiveProps.push('CREDENTIAL')

      if (sensitiveProps.length > 0) {
        lines.push(
          `  ⚠️  SENSITIVE DATA DETECTED: ${sensitiveProps.join(', ')}`
        )
      }
    } else if (boundary.analysisError) {
      lines.push(`  ⚠️  Type analysis failed: ${boundary.analysisError}`)
    }

    lines.push('')
  }

  lines.push('==========================================\n')

  return lines.join('\n')
}
