import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { tag } = body

  if (tag) {
    revalidateTag(tag)
    return NextResponse.json({ revalidated: true, tag })
  }

  return NextResponse.json({ revalidated: false }, { status: 400 })
}
