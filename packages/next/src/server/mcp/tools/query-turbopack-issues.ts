/**
 * MCP tool for querying Turbopack issues (errors, warnings, etc).
 *
 * This tool provides access to compilation issues reported by Turbopack including:
 * - Build errors
 * - Warnings
 * - Lints and suggestions
 *
 * Based on the original implementation from PR #81770.
 */
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import type { Issue, StyledString, Project } from '../../../build/swc/types'
import type { EntryIssuesMap } from '../../../shared/lib/turbopack/utils'
import { mcpTelemetryTracker } from '../mcp-telemetry-tracker'
import z from 'next/dist/compiled/zod'

// Issue with route information
type IssueWithRoute = Issue & { route?: string }

function styledStringToMarkdown(styledString: StyledString | undefined): string {
  if (!styledString) {
    return ''
  }
  switch (styledString.type) {
    case 'text':
      return styledString.value
    case 'strong':
      return `*${styledString.value}*`
    case 'code':
      return `\`${styledString.value}\``
    case 'line':
      return styledString.value.map(styledStringToMarkdown).join('')
    case 'stack':
      return styledString.value.map(styledStringToMarkdown).join('\n\n')
    default:
      return ''
  }
}

function indent(str: string, spaces: number = 2): string {
  const indentStr = ' '.repeat(spaces)
  return `${indentStr}${str.replace(/\n/g, `\n${indentStr}`)}`
}

function issueToString(issue: IssueWithRoute): string {
  return [
    `${issue.severity} in ${issue.stage}${issue.route ? ` on ${issue.route}` : ''}`,
    `File Path: ${issue.filePath}`,
    issue.source &&
      `Source:
  ${issue.source.source.ident}
  ${issue.source.range ? `Range: ${issue.source.range?.start.line}:${issue.source.range?.start.column} - ${issue.source.range?.end.line}:${issue.source.range?.end.column}` : 'Unknown range'}
`,
    `Title: ${styledStringToMarkdown(issue.title)}`,
    issue.description &&
      `Description:
${indent(styledStringToMarkdown(issue.description))}`,
    issue.detail &&
      `Details:
${indent(styledStringToMarkdown(issue.detail))}`,
    issue.documentationLink && `Documentation: ${issue.documentationLink}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function issuesReference(issues: Issue[]): { type: 'text'; text: string } {
  if (issues.length === 0) {
    return {
      type: 'text',
      text: 'Note: There are no issues.',
    }
  }

  const countBySeverity = new Map<string, number>()

  for (const issue of issues) {
    const count = countBySeverity.get(issue.severity) || 0
    countBySeverity.set(issue.severity, count + 1)
  }

  const text = [
    `Note: There are ${issues.length} issues in total, with the following severities: ${Array.from(
      countBySeverity.entries()
    )
      .map(([severity, count]) => `${count} x ${severity}`)
      .join(', ')}.`,
  ]

  return {
    type: 'text',
    text: text.join('\n'),
  }
}

const PAGE_SIZE = 50

export function registerQueryTurbopackIssuesTool(
  server: McpServer,
  getTurbopackProject: () => Project | undefined,
  getCurrentIssues: () => EntryIssuesMap
) {
  server.registerTool(
    'query_turbopack_issues',
    {
      description:
        'Query Turbopack compilation issues (errors, warnings, lints, etc). Issues are paginated when there are more than 50. Only available when running with Turbopack.',
      inputSchema: {
        route: z
          .string()
          .optional()
          .describe(
            'Filter issues to a specific route. If not provided, returns all issues.'
          ),
        page: z
          .number()
          .optional()
          .describe(
            'Issues are paginated when there are more than 50 issues. The first page is number 0.'
          ),
      },
    },
    async (request) => {
      // Track telemetry
      mcpTelemetryTracker.recordToolCall('mcp/query_turbopack_issues')

      try {
        const turbopackProject = getTurbopackProject()
        if (!turbopackProject) {
          return {
            content: [
              {
                type: 'text',
                text: 'Turbopack is not available. This tool only works when running with Turbopack (next dev --turbopack).',
              },
            ],
          }
        }

        const issuesMap = getCurrentIssues()
        const allIssues: IssueWithRoute[] = []

        // Collect issues from the entry issues map
        for (const [entryKey, entryIssues] of issuesMap.entries()) {
          for (const issue of entryIssues.values()) {
            const issueWithRoute = { ...issue, route: entryKey } as IssueWithRoute

            // Filter by route if specified
            if (request.route && entryKey !== request.route) {
              continue
            }

            allIssues.push(issueWithRoute)
          }
        }

        // Sort by severity
        const severitiesArray = [
          'bug',
          'fatal',
          'error',
          'warning',
          'hint',
          'note',
          'suggestion',
          'info',
        ]
        const severities = new Map(
          severitiesArray.map((severity, index) => [severity, index])
        )
        allIssues.sort((a, b) => {
          const severityA = severities.get(a.severity)
          const severityB = severities.get(b.severity)
          if (severityA !== undefined && severityB !== undefined) {
            return severityA - severityB
          }
          return 0
        })

        const content: Array<{ type: 'text'; text: string }> = []
        content.push(issuesReference(allIssues))

        const page = request.page ?? 0
        const currentPage = allIssues.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

        for (const issue of currentPage) {
          content.push({
            type: 'text',
            text: issueToString(issue),
          })
        }

        if (allIssues.length >= (page + 1) * PAGE_SIZE) {
          content.push({
            type: 'text',
            text: `Note: There are more issues available. Use the \`page\` parameter to query the next page.`,
          })
        }

        return { content }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    }
  )
}
