import { useState } from 'react'
import { ChatHeader } from './chat-header'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatToolbar } from './chat-toolbar'
import { useChatMessages } from './use-chat-messages'
import { useChatStream } from './use-chat-stream'
import './chat-interface.css'

interface ChatInterfaceProps {
  onClose?: () => void
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedSourcePath, setSelectedSourcePath] = useState<string | null>(
    null
  )
  const { messages, setMessages, isLoading, setIsLoading } = useChatMessages()
  const { sendMessage } = useChatStream(setMessages, setIsLoading)

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => !prev)
  }

  const handleSubmitMessage = async (content: string) => {
    if (isLoading) return
    const context = selectedSourcePath
      ? { sourcePath: selectedSourcePath }
      : undefined
    console.log(
      '🐛 DEBUG: handleSubmitMessage - content:',
      content,
      'context:',
      context,
      'selectedSourcePath:',
      selectedSourcePath
    )
    await sendMessage(content, context)
    setSelectedSourcePath(null) // Clear after sending
  }

  const handleElementSelected = (sourcePath: string) => {
    console.log('🐛 DEBUG: Element selected:', sourcePath)
    setSelectedSourcePath(sourcePath)
  }

  return (
    <div className={`chatContainer ${isMinimized ? 'minimized' : ''}`}>
      <ChatHeader
        onClose={onClose || (() => {})}
        onToggleMinimize={handleToggleMinimize}
        isMinimized={isMinimized}
      />

      {!isMinimized && (
        <>
          <ChatToolbar onElementSelected={handleElementSelected} />
          {selectedSourcePath && (
            <div
              style={{
                padding: '4px 8px',
                background: '#e0f2fe',
                fontSize: '11px',
                color: '#0369a1',
                borderBottom: '1px solid #d1d5db',
              }}
            >
              Selected: {selectedSourcePath}
            </div>
          )}
          <div className="chatContent">
            <div className="messagesContainer">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="messageGroup">
                  <div className="messageContent assistant">
                    <p style={{ margin: 0, color: '#9ca3af' }}>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ChatInput
            onSubmit={handleSubmitMessage}
            disabled={isLoading}
            placeholder="Ask a question..."
          />
        </>
      )}
    </div>
  )
}
