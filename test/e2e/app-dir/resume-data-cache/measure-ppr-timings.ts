// Utility to measure PPR streaming timings
export async function measurePPRTimings(
  fetchFn: () => Promise<Response>,
  expectedDelay: number
) {
  const start = Date.now()
  const chunks: string[] = []
  let streamFirstChunk = 0
  let streamEnd = 0

  const response = await fetchFn()

  if (!response.body) {
    throw new Error('No response body returned')
  }

  // In Node.js fetch, body might not be a web stream
  // Let's handle both cases
  const body = response.body as any

  if (typeof body.getReader === 'function') {
    // Web Streams API
    const reader = body.getReader()
    const decoder = new TextDecoder()

    try {
      let done = false
      let firstChunk = true

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          if (firstChunk) {
            streamFirstChunk = Date.now()
            firstChunk = false
          }

          const chunk = decoder.decode(value, { stream: true })
          chunks.push(chunk)
        }
      }

      streamEnd = Date.now()
    } finally {
      reader.releaseLock()
    }
  } else {
    // Node.js streams - collect all data at once
    streamFirstChunk = Date.now()
    const text = await response.text()
    chunks.push(text)
    streamEnd = Date.now()
  }

  return {
    timings: {
      start,
      streamFirstChunk,
      streamEnd,
    },
    chunks,
  }
}
