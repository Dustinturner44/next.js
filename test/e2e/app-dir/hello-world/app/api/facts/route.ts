import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try to get a random fact from uselessfacts API
    const response = await fetch(
      'https://uselessfacts.jsph.pl/random.json?language=en'
    )

    if (!response.ok) {
      throw new Error('Failed to fetch fact')
    }

    const factData = await response.json()

    return NextResponse.json({
      text: factData.text,
      source: factData.source_url || 'Useless Facts API',
      timestamp: new Date().toISOString(),
      api_source: 'Useless Facts API',
    })
  } catch (error: any) {
    // Fallback facts if API fails
    const fallbackFacts = [
      'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.',
      "A group of flamingos is called a 'flamboyance'.",
      "Bananas are berries, but strawberries aren't.",
      'The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.',
      'Octopuses have three hearts and blue blood.',
      'A single cloud can weight more than a million pounds.',
      "The human brain uses about 20% of the body's total energy.",
      'There are more possible games of chess than there are atoms in the observable universe.',
    ]

    const randomFact =
      fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)]

    return NextResponse.json({
      text: randomFact,
      source: 'Built-in Facts',
      timestamp: new Date().toISOString(),
      api_source: 'Fallback Facts',
      fallback: true,
    })
  }
}
