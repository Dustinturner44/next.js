import { headers } from 'next/headers'
import { Metadata } from 'next'
import { unstable_noStore } from 'next/cache'

async function getChatIdFromHeaders() {
  const headersList = await headers()
  return headersList.get('x-chat-id') || 'default-id'
}

export async function generateMetadata(): Promise<Metadata> {
  const chatId = await getChatIdFromHeaders()

  // Simulate async DB call like v0
  await new Promise((resolve) => setTimeout(resolve, 100))

  return {
    title: `Chat ${chatId}`,
    description: `Chat session ${chatId}`,
  }
}

export default async function ChatPage() {
  unstable_noStore()

  const chatId = await getChatIdFromHeaders()

  if (!chatId) {
    return <div>No chat ID</div>
  }

  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 50))
  const random = Math.random()

  return (
    <div>
      <h1>Chat {chatId}</h1>
      <p>Random: {random}</p>
    </div>
  )
}
