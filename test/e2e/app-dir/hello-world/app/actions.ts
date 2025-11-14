'use server'

export async function streamData(origin: string) {
  const response = await fetch(new URL('/api/stream', origin))

  const [body1, body2] = response.body.tee()

  const reader = body2.getReader()

  ;(async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        console.log('CHUNK', value.byteLength)
      }
    } finally {
      reader.releaseLock()
    }
  })()

  return body1
}
