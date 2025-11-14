'use client'

import { useState } from 'react'
import { streamData } from './actions'

export default function Page() {
  const [chunks, setChunks] = useState<string[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const handleClick = async () => {
    setChunks([])
    setIsStreaming(true)

    const stream = await streamData(window.location.origin)
    // const response = await fetch('/api/stream')
    // const stream = await response.body
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        console.log('Received chunk:', chunk)
        setChunks((prev) => [...prev, chunk])
      }
      console.log('Complete')
    } finally {
      reader.releaseLock()
      setIsStreaming(false)
    }
  }

  return (
    <div>
      <button disabled={isStreaming} onClick={handleClick}>
        {isStreaming ? 'Streaming...' : 'Start Stream'}
      </button>

      <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
        {chunks.length > 0 && (
          <div>
            <h3>Received {chunks.length} chunks:</h3>
            <div>
              {chunks.map((chunk, i) => (
                <div key={i}>{chunk}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
