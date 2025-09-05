import type { IncomingMessage, ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { middlewareResponse } from '../../next-devtools/server/middleware-response'

// Fix for Dict type missing in Claude Code SDK
declare global {
  type Dict<T = any> = Record<string, T>
}

interface ChatRequest {
  message: string
  context?: {
    sourcePath?: string
  }
}

export function getChatMiddleware() {
  return async function (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const { pathname } = new URL(`http://n${req.url}`)

    if (pathname !== '/__nextjs_chat') {
      return next()
    }

    // Set CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 200
      res.end()
      return
    }

    if (req.method !== 'POST') {
      return middlewareResponse.methodNotAllowed(res)
    }

    try {
      const body = await new Promise<string>((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => {
          data += chunk
        })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })

      const chatRequest: ChatRequest = JSON.parse(body)

      if (!chatRequest.message) {
        return middlewareResponse.badRequest(res)
      }

      // Set up streaming response headers to prevent buffering
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Transfer-Encoding', 'chunked')
      res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
      res.setHeader('X-Content-Type-Options', 'nosniff')

      // Process the chat request with streaming
      // Use process.cwd() as the root directory for resolving relative paths
      await processStreamingChatRequest(chatRequest, res, process.cwd())
    } catch (error) {
      console.error('Chat middleware error:', error)
      return middlewareResponse.internalServerError(res, error)
    }
  }
}

// Helper function to resolve file paths to absolute paths (copied from launch-editor.ts)
function resolveFilePath(file: string, nextRootDirectory: string): string {
  if (file.startsWith('file://')) {
    try {
      return fileURLToPath(file)
    } catch (error) {
      return file // Fallback to original if URL parsing fails
    }
  } else if (path.isAbsolute(file)) {
    return file
  } else {
    return path.join(nextRootDirectory, file)
  }
}

// Helper function to write and flush immediately for real streaming
function writeAndFlush(res: ServerResponse, data: any) {
  res.write(JSON.stringify(data) + '\n')
  if ('flush' in res) {
    ;(res as any).flush()
  }
}

async function processStreamingChatRequest(
  request: ChatRequest,
  res: ServerResponse,
  nextRootDirectory: string
): Promise<void> {
  try {
    let prompt = request.message

    // Add context to prompt if provided
    if (request.context?.sourcePath) {
      // Resolve to absolute path for better Claude Code SDK compatibility
      const absolutePath = resolveFilePath(
        request.context.sourcePath,
        nextRootDirectory
      )

      prompt = `The user is asking about code at: ${absolutePath}

User question: ${request.message}`
      console.log('[Input] Prompt with context:', prompt)
      console.log('[Input] Context (resolved):', {
        ...request.context,
        sourcePath: absolutePath,
      })
    } else {
      console.log('[Input] Prompt:', prompt)
    }

    // Dynamic import of Claude Code SDK (ES module)
    const { query } = await import('@anthropic-ai/claude-code')

    // Send initial message to test streaming
    writeAndFlush(res, { type: 'start' })

    // Stream messages from Claude Code SDK
    for await (const message of query({
      prompt,
      options: {
        maxTurns: 20, // Allow multiple turns for complex tasks
        customSystemPrompt:
          'You are Claude, helping with Next.js development. Keep responses concise and helpful. Focus on practical advice and solutions.',
        allowedTools: [
          'Read',
          'Write',
          'Edit',
          'MultiEdit',
          'NotebookEdit',
          'Grep',
          'Glob',
          'WebFetch',
          'WebSearch',
          'BashOutput',
          'KillBash',
          'Bash',
          'Task',
          'TodoWrite',
          'ExitPlanMode',
        ], // Allow all tools for full code modification capabilities
      },
    })) {
      console.log(
        '[Output] Received message type:',
        message.type,
        JSON.stringify(message)
      )

      if (message.type === 'assistant') {
        // Extract content from assistant message
        const content_blocks = message.message?.content || []

        for (const block of content_blocks) {
          if (block.type === 'text') {
            // Regular text response
            writeAndFlush(res, {
              type: 'content',
              content: block.text,
            })
          } else if (block.type === 'tool_use') {
            // Tool usage - show what tool is being used
            writeAndFlush(res, {
              type: 'content',
              content: `🔧 Using ${block.name}...`,
            })
          }
        }
      } else if (message.type === 'user') {
        // Handle tool results from user messages
        const content_blocks = message.message?.content || []
        for (const block of content_blocks) {
          if (
            typeof block === 'object' &&
            block.type === 'tool_result' &&
            block.content
          ) {
            // Show tool result (truncated if too long)
            const result =
              typeof block.content === 'string'
                ? block.content.slice(0, 200) +
                  (block.content.length > 200 ? '...' : '')
                : JSON.stringify(block.content).slice(0, 200)
            writeAndFlush(res, {
              type: 'content',
              content: `📝 ${result}`,
            })
          }
        }
      } else if (message.type === 'result') {
        if (message.subtype === 'success') {
          // Send final result
          writeAndFlush(res, {
            type: 'complete',
            content: message.result,
            success: true,
          })
        } else {
          console.error('Claude Code SDK streaming error:', message)
          // Handle specific error types with better messages
          let errorContent =
            'Sorry, I encountered an error processing your request.'

          if (message.subtype === 'error_max_turns') {
            errorContent =
              'The request was too complex and exceeded the maximum conversation turns. Please try breaking it into smaller, more specific questions.'
          } else if (message.subtype === 'error_during_execution') {
            errorContent =
              'An error occurred while processing your request. Please try again or rephrase your question.'
          }

          writeAndFlush(res, {
            type: 'error',
            content: errorContent,
            success: false,
          })
        }
        break
      }
    }

    res.end()
  } catch (error) {
    console.error('Claude Code SDK streaming error:', error)
    writeAndFlush(res, {
      type: 'error',
      content: `Sorry, I encountered an error processing your request. ${JSON.stringify(error)}`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    res.end()
  }
}
