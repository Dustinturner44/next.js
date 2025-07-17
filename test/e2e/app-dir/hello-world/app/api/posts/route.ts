import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts')

    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }

    const posts = await response.json()

    return NextResponse.json({
      data: posts,
      timestamp: new Date().toISOString(),
      source: 'JSONPlaceholder API',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch posts',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
