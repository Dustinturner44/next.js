import { headers } from 'next/headers'
import { connection } from 'next/server'

export async function generateMetadata() {
  // This async metadata generation might cause timing differences
  const headersList = await headers()
  const id = headersList.get('x-id') || 'default'

  // Simulate DB call
  await new Promise((resolve) => setTimeout(resolve, 50))

  return {
    title: `Page ${id}`,
    description: `Description for ${id}`,
  }
}

export default async function Page() {
  await connection()
  // Dynamic content that changes between renders
  const random = Math.random()

  return (
    <div>
      <h1>Main Page Content</h1>
      <p>Random: {random}</p>
    </div>
  )
}
