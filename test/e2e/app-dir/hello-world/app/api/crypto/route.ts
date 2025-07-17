import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Using CoinGecko's free API to get top 10 cryptocurrencies
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
    )

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data')
    }

    const cryptoData = await response.json()

    // Transform the data to a more manageable format
    const formattedData = cryptoData.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      image: coin.image,
    }))

    return NextResponse.json({
      data: formattedData,
      timestamp: new Date().toISOString(),
      source: 'CoinGecko API',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch cryptocurrency data',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
