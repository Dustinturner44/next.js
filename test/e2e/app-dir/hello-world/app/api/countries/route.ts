import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch all countries first
    const response = await fetch(
      'https://restcountries.com/v3.1/all?fields=name,capital,population,flag'
    )

    if (!response.ok) {
      throw new Error('Failed to fetch countries')
    }

    const allCountries = await response.json()

    // Select 10 random countries
    const shuffled = allCountries.sort(() => 0.5 - Math.random())
    const randomCountries = shuffled.slice(0, 10)

    return NextResponse.json({
      data: randomCountries,
      timestamp: new Date().toISOString(),
      source: 'REST Countries API',
      total: allCountries.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch countries',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
