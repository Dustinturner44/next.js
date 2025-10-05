import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import * as path from 'path'
import { makeDevtoolsRequest } from '../utils/api-client'

interface PageMetadataResponse {
  metadata: Record<string, SegmentTrieData>
  projectPath?: string
  message?: string
}

interface SegmentTrieData {
  segmentTrie: SegmentTrieNode | null
  routerType: 'app' | 'pages'
}

interface SegmentTrieNode {
  value?: {
    type: string
    pagePath: string
    boundaryType: string | null
  }
  children: Record<string, SegmentTrieNode>
}

export function registerGetPageMetadataTool(server: McpServer) {
  server.registerTool(
    'get_page_metadata',
    {
      description:
        'Get runtime metadata about what contributes to the current page render from active browser sessions.',
      inputSchema: {
        baseUrl: z.string(),
      },
    },
    async (request) => {
      try {
        const { baseUrl } = request

        const response = await makeDevtoolsRequest<PageMetadataResponse>(
          baseUrl,
          '/page-metadata'
        )

        if (response.message) {
          return {
            content: [
              {
                type: 'text',
                text: response.message,
              },
            ],
          }
        }

        const output = formatPageMetadata(
          response.metadata,
          response.projectPath
        )

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        }
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

function formatPageMetadata(
  metadata: Record<string, SegmentTrieData>,
  projectPath?: string
): string {
  const lines: string[] = []

  const entries = Object.entries(metadata)

  if (entries.length === 0) {
    return 'No browser sessions with metadata available.'
  }

  lines.push(`# Page metadata from ${entries.length} browser session(s)`)
  lines.push('')

  for (const [url, data] of entries) {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    lines.push(`## Session: ${pathname}`)
    lines.push('')
    lines.push(`**Router type:** ${data.routerType}`)
    lines.push('')

    const segments = flattenSegmentTrie(data.segmentTrie)

    if (segments.length > 0) {
      lines.push('### Files powering this page:')
      lines.push('')

      const sortedSegments = sortSegments(segments)

      for (const segment of sortedSegments) {
        let basePath = segment.pagePath.replace('@boundary', '')
        const isBuiltin = segment.pagePath.startsWith('__next_builtin__')

        if (projectPath && !isBuiltin) {
          const absoluteSegmentPath = path.resolve(process.cwd(), basePath)
          const relativeToProject = path.relative(
            projectPath,
            absoluteSegmentPath
          )

          // Only use relative path if file is inside project (paths starting with .. are outside)
          if (!relativeToProject.startsWith('..')) {
            basePath = relativeToProject
          }
        }

        if (basePath.startsWith('app/') || basePath.startsWith('src/app/')) {
          basePath = basePath.replace(/^src\//, '').replace(/^app\//, '')
        }

        const displayPath = isBuiltin
          ? segment.pagePath.replace('__next_builtin__', '')
          : `app/${basePath}`

        let line = `- ${displayPath}`

        if (segment.type.startsWith('boundary:')) {
          line = `- ${displayPath} (boundary${isBuiltin ? ', builtin' : ''})`
        }

        lines.push(line)
      }

      lines.push('')
    } else {
      lines.push('*No segments found*')
      lines.push('')
    }

    lines.push('---')
  }

  return lines.join('\n')
}

function flattenSegmentTrie(
  trie: SegmentTrieNode | null
): Array<{ type: string; pagePath: string; boundaryType: string | null }> {
  if (!trie) {
    return []
  }

  const segments: Array<{
    type: string
    pagePath: string
    boundaryType: string | null
  }> = []

  function traverse(node: SegmentTrieNode) {
    if (node.value) {
      segments.push(node.value)
    }

    for (const child of Object.values(node.children)) {
      traverse(child)
    }
  }

  traverse(trie)
  return segments
}

function sortSegments(
  segments: Array<{
    type: string
    pagePath: string
    boundaryType: string | null
  }>
): Array<{ type: string; pagePath: string; boundaryType: string | null }> {
  const getTypeGroup = (type: string): number => {
    if (type === 'layout') return 0
    if (type.startsWith('boundary:')) return 1
    if (type === 'page') return 2
    return 99
  }

  const getBoundaryOrder = (type: string): number => {
    if (type === 'boundary:global-error') return 0
    if (type === 'boundary:error') return 1
    if (type === 'boundary:loading') return 2
    if (type === 'boundary:not-found') return 3
    return 99
  }

  return segments.sort((a, b) => {
    const groupA = getTypeGroup(a.type)
    const groupB = getTypeGroup(b.type)

    if (groupA !== groupB) {
      return groupA - groupB
    }

    if (groupA === 1) {
      const boundaryOrderA = getBoundaryOrder(a.type)
      const boundaryOrderB = getBoundaryOrder(b.type)

      if (boundaryOrderA !== boundaryOrderB) {
        return boundaryOrderA - boundaryOrderB
      }
    }

    const pathA = a.pagePath
      .replace('@boundary', '')
      .replace('__next_builtin__', '')
    const pathB = b.pagePath
      .replace('@boundary', '')
      .replace('__next_builtin__', '')

    const depthA = pathA.split('/').filter(Boolean).length
    const depthB = pathB.split('/').filter(Boolean).length

    if (depthA !== depthB) {
      return depthA - depthB
    }

    return pathA.localeCompare(pathB)
  })
}
