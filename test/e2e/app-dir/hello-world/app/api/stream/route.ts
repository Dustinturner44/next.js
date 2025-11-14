import { setTimeout } from 'timers/promises'

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.\n'

const totalBytes = 5 * 1024 // 32 KB
const bytesPerChunk = 100 // bytes per chunk
const chunkCount = Math.ceil(totalBytes / bytesPerChunk)

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < chunkCount; i++) {
        await setTimeout(10)
        controller.enqueue(encoder.encode(`${i} ${loremIpsum}`))
      }

      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain' } })
}
