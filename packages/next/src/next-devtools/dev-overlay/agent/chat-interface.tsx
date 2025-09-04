import { useState } from 'react'
import { ChatHeader } from './chat-header'
import { ChatMessage, type Message } from './chat-message'
import { ChatInput } from './chat-input'
import './chat-interface.css'

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Change this button to blue',
    role: 'user',
    timestamp: new Date(),
  },
  {
    id: '2',
    content: 'Done!',
    role: 'assistant',
    timestamp: new Date(),
  },
]

interface ChatInterfaceProps {
  onClose?: () => void
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => !prev)
  }

  const handleSubmitMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'd be happy to help! Could you provide more details about what you're trying to accomplish?",
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
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
