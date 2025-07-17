import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://dog.ceo/api/breeds/image/random')

    if (!response.ok) {
      throw new Error('Failed to fetch dog image')
    }

    const dogData = await response.json()

    return NextResponse.json({
      message: dogData.message,
      status: dogData.status,
      timestamp: new Date().toISOString(),
      source: 'Dog CEO API',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch dog image',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
