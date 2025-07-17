import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Using quotable.io - a free quotes API
    const response = await fetch(
      'https://api.quotable.io/random?minLength=50&maxLength=200'
    )

    if (!response.ok) {
      throw new Error('Failed to fetch quote')
    }

    const quoteData = await response.json()

    return NextResponse.json({
      text: quoteData.content,
      author: quoteData.author,
      timestamp: new Date().toISOString(),
      source: 'Quotable API',
      tags: quoteData.tags,
    })
  } catch (error: any) {
    // Fallback quotes if API fails
    const fallbackQuotes = [
      {
        text: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs',
      },
      {
        text: 'Innovation distinguishes between a leader and a follower.',
        author: 'Steve Jobs',
      },
      {
        text: "Life is what happens to you while you're busy making other plans.",
        author: 'John Lennon',
      },
      {
        text: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      {
        text: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
      },
    ]

    const randomQuote =
      fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]

    return NextResponse.json({
      ...randomQuote,
      timestamp: new Date().toISOString(),
      source: 'Fallback Quotes',
      fallback: true,
    })
  }
}
