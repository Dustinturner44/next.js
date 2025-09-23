import { z } from 'next/dist/compiled/zod'
import type { McpServer } from 'next/dist/compiled/@modelcontextprotocol/sdk/server/mcp'
import type {
  OriginalStackFramesRequest,
  OriginalStackFramesResponse,
} from '../../../next-devtools/server/shared'

let stackFrameResolver:
  | ((
      request: OriginalStackFramesRequest
    ) => Promise<OriginalStackFramesResponse>)
  | undefined

export function setStackFrameResolver(resolver: typeof stackFrameResolver) {
  stackFrameResolver = resolver
}

export async function getOriginalSourceFromBundled(
  bundledStackFrames: OriginalStackFramesRequest['frames'],
  context: {
    isServer: boolean
    isEdgeServer: boolean
    isAppDirectory: boolean
  }
): Promise<OriginalStackFramesResponse> {
  if (!stackFrameResolver) {
    throw new Error(
      'Stack frame resolver not available. This is a bug in Next.js.'
    )
  }

  const request: OriginalStackFramesRequest = {
    frames: bundledStackFrames,
    isServer: context.isServer,
    isEdgeServer: context.isEdgeServer,
    isAppDirectory: context.isAppDirectory,
  }

  return stackFrameResolver(request)
}

export function registerResolveStackFramesTool(server: McpServer) {
  server.registerTool(
    'resolve_stack_frames',
    {
      description:
        'Resolve bundled/minified stack frames to original source locations using source maps',
      inputSchema: {
        frames: z
          .array(
            z.object({
              file: z
                .union([z.string(), z.null()])
                .describe('File path or URL (e.g., webpack-internal://...)'),
              methodName: z.string().describe('Method/function name'),
              arguments: z.array(z.string()).describe('Method arguments'),
              line1: z
                .union([z.number(), z.null()])
                .describe('1-based line number in bundled code'),
              column1: z
                .union([z.number(), z.null()])
                .describe('1-based column number in bundled code'),
            })
          )
          .describe('Stack frames from error.stack or console trace'),
        isServer: z
          .boolean()
          .describe('Whether error occurred during server-side rendering'),
        isEdgeServer: z
          .boolean()
          .describe('Whether error occurred in edge runtime'),
        isAppDirectory: z
          .boolean()
          .describe('Whether using Next.js app directory structure'),
      },
    },
    async (request) => {
      try {
        const { frames, isServer, isEdgeServer, isAppDirectory } = request as {
          frames: OriginalStackFramesRequest['frames']
          isServer: boolean
          isEdgeServer: boolean
          isAppDirectory: boolean
        }

        const resolvedFrames = await getOriginalSourceFromBundled(frames, {
          isServer,
          isEdgeServer,
          isAppDirectory,
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(resolvedFrames, null, 2),
            },
          ],
        }
      } catch (error) {
        throw new Error(
          `Failed to resolve stack frames: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  )
}
