import './chat-interface.css'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  context?: {
    sourcePath?: string
  }
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`messageGroup ${isUser ? 'user' : ''}`}>
      <div className={`messageContent ${isUser ? 'user' : 'assistant'}`}>
        <div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{message.content}</p>
        </div>

        {isUser && (
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            className="messageTail user"
          >
            <path d="M0.866025 8.80383L11.2583 0.803833C11.2583 0.803833 12.0621 9.5 17.2583 13.1961C12.0621 13.1961 0.866025 8.80383 0.866025 8.80383Z" />
          </svg>
        )}
      </div>

      {isUser ? (
        <img
          className="avatar"
          src="https://vercel.com/api/www/avatar/8ef4f43e10927050fd37e3307dab77e5c49bc9f2?s=56"
          alt="User avatar"
          width="28"
          height="28"
        />
      ) : null}
    </div>
  )
}
