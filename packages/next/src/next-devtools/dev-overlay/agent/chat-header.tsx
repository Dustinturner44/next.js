import './chat-interface.css'

interface ChatHeaderProps {
  onClose: () => void
  onToggleMinimize: () => void
  isMinimized: boolean
}

export function ChatHeader({
  onClose,
  onToggleMinimize,
  isMinimized,
}: ChatHeaderProps) {
  return (
    <div className="chatHeader">
      <h2 className="chatTitle">
        <svg className="chatIcon" viewBox="0 0 16 16">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.8914 10.4028L2.98327 10.6318C3.22909 11.2445 3.5 12.1045 3.5 13C3.5 13.3588 3.4564 13.7131 3.38773 14.0495C3.69637 13.9446 4.01409 13.8159 4.32918 13.6584C4.87888 13.3835 5.33961 13.0611 5.70994 12.7521L6.22471 12.3226L6.88809 12.4196C7.24851 12.4724 7.61994 12.5 8 12.5C11.7843 12.5 14.5 9.85569 14.5 7C14.5 4.14431 11.7843 1.5 8 1.5C4.21574 1.5 1.5 4.14431 1.5 7C1.5 8.18175 1.94229 9.29322 2.73103 10.2153L2.8914 10.4028ZM2.8135 15.7653C1.76096 16 1 16 1 16C1 16 1.43322 15.3097 1.72937 14.4367C1.88317 13.9834 2 13.4808 2 13C2 12.3826 1.80733 11.7292 1.59114 11.1903C0.591845 10.0221 0 8.57152 0 7C0 3.13401 3.58172 0 8 0C12.4183 0 16 3.13401 16 7C16 10.866 12.4183 14 8 14C7.54721 14 7.10321 13.9671 6.67094 13.9038C6.22579 14.2753 5.66881 14.6656 5 15C4.23366 15.3832 3.46733 15.6195 2.8135 15.7653Z"
            fill="currentColor"
          />
        </svg>
        Vercel Vector™
      </h2>
      <div className="headerActions">
        <button
          type="button"
          onClick={onToggleMinimize}
          className="actionButton"
          aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
          title={isMinimized ? 'Maximize chat' : 'Minimize chat'}
        >
          {isMinimized ? (
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 2H14V14H2V2ZM3 3V13H13V3H3Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1 2H15V3H1V2ZM4 6H12V7H4V6ZM4 10H12V11H4V10Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="actionButton"
          aria-label="Close chat"
          title="Close chat"
        >
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
