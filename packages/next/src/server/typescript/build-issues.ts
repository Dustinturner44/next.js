/**
 * Build issues reader for the TypeScript plugin
 *
 * Reads build-issues.json written by the dev server and provides
 * issues to be shown as diagnostics in VS Code's Problems panel.
 */

import * as fs from 'fs'
import * as path from 'path'

interface BuildIssue {
  file: string
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
  code: string
}

interface BuildIssuesFile {
  version: number
  timestamp: number
  issues: BuildIssue[]
}

// Cache per .next directory to support multiple projects
const cacheMap = new Map<string, { data: BuildIssuesFile | null; mtime: number }>()

/**
 * Find the .next directory by walking up from startDir
 */
function findNextDir(startDir: string): string | null {
  let dir = startDir
  const root = path.parse(dir).root

  while (dir !== root) {
    const candidate = path.join(dir, '.next')
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate
      }
    } catch {
      // Ignore errors
    }
    dir = path.dirname(dir)
  }
  return null
}

/**
 * Find the build-issues.json file
 */
function findBuildIssuesPath(nextDir: string): string | null {
  const candidates = [
    path.join(nextDir, 'build-issues.json'),
    path.join(nextDir, 'dev', 'build-issues.json'),
  ]

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    } catch {
      // Ignore errors
    }
  }
  return null
}

/**
 * Reset the cache
 */
export function resetBuildIssuesCache(): void {
  cacheMap.clear()
}

/**
 * Get build issues for a specific file
 */
export function getBuildIssuesForFile(filePath: string): BuildIssue[] {
  // Find .next dir for this file
  const nextDir = findNextDir(path.dirname(filePath))
  if (!nextDir) return []

  const issuesPath = findBuildIssuesPath(nextDir)
  if (!issuesPath) return []

  // Get or create cache entry for this .next directory
  let cacheEntry = cacheMap.get(nextDir)
  if (!cacheEntry) {
    cacheEntry = { data: null, mtime: 0 }
    cacheMap.set(nextDir, cacheEntry)
  }

  // Check mtime and reload if needed
  try {
    const stat = fs.statSync(issuesPath)
    if (stat.mtimeMs > cacheEntry.mtime) {
      const content = fs.readFileSync(issuesPath, 'utf-8')
      cacheEntry.data = JSON.parse(content)
      cacheEntry.mtime = stat.mtimeMs
    }
  } catch {
    return []
  }

  if (!cacheEntry.data || !cacheEntry.data.issues) return []

  // Normalize the file path for matching
  const normalizedPath = filePath.replace(/\\/g, '/')

  // Find issues for this file
  return cacheEntry.data.issues.filter((issue) => {
    const issuePath = issue.file.replace(/\\/g, '/')
    return normalizedPath.endsWith(issuePath) || normalizedPath.includes(issuePath)
  })
}

/**
 * Convert severity to TypeScript DiagnosticCategory
 */
export function severityToCategory(
  severity: 'error' | 'warning' | 'info',
  ts: typeof import('typescript')
): import('typescript').DiagnosticCategory {
  switch (severity) {
    case 'error':
      return ts.DiagnosticCategory.Error
    case 'warning':
      return ts.DiagnosticCategory.Warning
    case 'info':
      return ts.DiagnosticCategory.Suggestion
    default:
      return ts.DiagnosticCategory.Warning
  }
}
