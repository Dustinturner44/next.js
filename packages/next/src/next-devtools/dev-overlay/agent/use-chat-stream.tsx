import { useCallback } from 'react'
import { z } from 'zod'
import type { Message } from './chat-message'

const QuickActionRequestSchema = z.object({
  loc: z.string().nullable().optional(),
  query: z.string().min(1, 'query cannot be empty'),
  url: z.string().optional(), // Current page URL for context
})

export function useChatStream(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading: (loading: boolean) => void
) {
  const sendMessage = useCallback(
    async (content: string, selectedElement: string | null) => {
      if (!content.trim()) return

      // Validate that we have a selected element
      if (!selectedElement) {
        console.log(`[DEBUG] No element selected. It's a general query`)
      }

      console.log('🐛 DEBUG: sendMessage called with:', {
        content,
        selectedElement,
      })

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date(),
        context: { sourcePath: selectedElement ?? undefined },
      }

      // Get current conversation history before adding the new message
      setMessages((currentMessages) => {
        const conversationHistory = currentMessages
        const updatedMessages = [...currentMessages, userMessage]

        // Start the async message sending process
        sendMessageWithHistory(
          content,
          selectedElement,
          conversationHistory,
          setMessages,
          setIsLoading
        )

        return updatedMessages
      })
      setIsLoading(true)
    },
    [setMessages, setIsLoading]
  )

  return { sendMessage }
}

// Separate function to handle the actual message sending with conversation history
async function sendMessageWithHistory(
  content: string,
  selectedElement: string | null,
  conversationHistory: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading: (loading: boolean) => void
) {
  const assistantMessageIdRef = { current: null as string | null }

  try {
    // Build conversation context from history
    // Only include the last 10 messages to avoid overwhelming the backend
    const recentHistory = conversationHistory.slice(-10)
    const conversationContext = recentHistory
      .map((msg) => {
        // Format messages more clearly for the assistant
        const role = msg.role === 'user' ? 'User' : 'Assistant'
        return `${role}: ${msg.content}`
      })
      .join('\n\n')

    // Combine current query with conversation history
    const contextualQuery =
      recentHistory.length > 0
        ? `Here is our conversation so far:\n\n${conversationContext}\n\n---\n\nUser: ${content}`
        : content

    // Use QuickActionRequestSchema format for Daemon
    // Ensure loc is either a valid string or explicitly null/undefined
    let loc: string | null = null
    if (
      selectedElement &&
      selectedElement.trim() !== '' &&
      selectedElement !== '.'
    ) {
      loc = selectedElement
    }

    const payload: { loc?: string | null; query: string; url?: string } = {
      query: contextualQuery,
      url: window.location.pathname, // Include current page pathname so daemon can retrieve segment trie data for this page
    }

    // Only include loc if it's a valid string
    // When loc is missing, daemon should query Next.js MCP server using the URL to get page structure
    if (loc) {
      payload.loc = loc
    }

    console.log(
      '🐛 DEBUG: selectedElement value:',
      selectedElement,
      'type:',
      typeof selectedElement
    )
    console.log(
      '🐛 DEBUG: payload.loc value:',
      payload.loc,
      'type:',
      typeof payload.loc
    )
    console.log('🐛 DEBUG: payload.url value:', payload.url)

    // Validate the payload
    const validatedPayload = QuickActionRequestSchema.parse(payload)
    console.log(
      '🐛 DEBUG: Sending request to Daemon with payload:',
      validatedPayload
    )
    console.log(
      '🐛 DEBUG: Final JSON payload:',
      JSON.stringify(validatedPayload, null, 2)
    )

    const response = await fetch('http://localhost:3010/quick-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedPayload),
    })

    console.log(
      '🐛 DEBUG: Response status:',
      response.status,
      response.statusText
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // Create initial assistant message
    const assistantMessageId = Date.now().toString()
    assistantMessageIdRef.current = assistantMessageId

    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      streaming: true,
    }

    setMessages((prev) => [...prev, initialAssistantMessage])
    let accumulatedText = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk

        console.log('🐛 DEBUG: Received text chunk:', JSON.stringify(chunk))
        console.log(
          '🐛 DEBUG: Accumulated text length:',
          accumulatedText.length
        )

        // Update the assistant message with accumulated text
        const currentAccumulated = accumulatedText
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: currentAccumulated }
              : msg
          )
        )
      }

      // Stream is complete, stop loading and remove streaming indicator
      // If no content was received, show a placeholder message
      const finalContent =
        accumulatedText.trim() || 'Your query has been completed.'

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: finalContent, streaming: false }
            : msg
        )
      )
      setIsLoading(false)
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    console.error('Chat streaming error:', error)

    const errorContent = `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`

    if (!assistantMessageIdRef.current) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageIdRef.current
            ? { ...msg, content: errorContent, streaming: false }
            : msg
        )
      )
    }

    console.log('🐛 DEBUG: Error occurred, message updated with error content')
  } finally {
    setIsLoading(false)
  }
}
