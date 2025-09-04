import { useState, useRef, useEffect } from 'react'
import './chat-interface.css'

interface ChatInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = 'Ask a question...',
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const maxLength = 1000

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.max(56, textarea.scrollHeight) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSubmit(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isSubmitDisabled =
    disabled || !message.trim() || message.length > maxLength

  return (
    <div className="chatInput">
      <div className="inputContainer">
        <form onSubmit={handleSubmit} className="inputForm">
          <textarea
            ref={textareaRef}
            className="textarea"
            name="message"
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            style={{ height: '56px' }}
          />
          <div className="inputFooter">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
              }}
            >
              <span className="charCount">
                {message.length}/{maxLength}
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="submitButton"
              aria-label="Submit"
            >
              <svg
                className="h-4 w-4"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14.7477 0.293701L0.747695 5.2937L0.730713 6.70002L6.81589 9.04047C6.88192 9.06586 6.93409 9.11804 6.95948 9.18406L9.29994 15.2692L10.7063 15.2523L15.7063 1.25226L14.7477 0.293701ZM7.31426 7.62503L3.15693 6.02605L12.1112 2.8281L7.31426 7.62503ZM8.37492 8.68569L9.9739 12.843L13.1719 3.88876L8.37492 8.68569Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
