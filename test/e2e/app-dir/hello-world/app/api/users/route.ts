import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users')

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const users = await response.json()

    return NextResponse.json({
      data: users,
      timestamp: new Date().toISOString(),
      source: 'JSONPlaceholder API',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
