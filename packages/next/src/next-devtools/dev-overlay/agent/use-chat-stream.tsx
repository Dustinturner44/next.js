import { useCallback } from 'react'
import { z } from 'zod'
import type { Message } from './chat-message'

const QuickActionRequestSchema = z.object({
  loc: z.string().min(1, 'loc cannot be empty'),
  query: z.string().min(1, 'query cannot be empty'),
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
        console.error(
          'No element selected. Please select an element before sending a message.'
        )
        return
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
        context: { sourcePath: selectedElement },
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      const assistantMessageIdRef = { current: null as string | null }

      try {
        // Use QuickActionRequestSchema format for Daemon
        const payload = {
          loc: selectedElement,
          query: content,
        }

        // Validate the payload
        const validatedPayload = QuickActionRequestSchema.parse(payload)
        console.log(
          '🐛 DEBUG: Sending request to Daemon with payload:',
          validatedPayload
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

            console.log('🐛 DEBUG: Received text chunk:', chunk)

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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, streaming: false } : msg
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
                ? { ...msg, content: errorContent }
                : msg
            )
          )
        }
      } finally {
        setIsLoading(false)
      }
    },
    [setMessages, setIsLoading]
  )

  return { sendMessage }
}
