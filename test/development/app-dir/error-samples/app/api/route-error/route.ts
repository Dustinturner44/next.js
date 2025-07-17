// @ts-ignore - Intentional error for testing auto-fix
import { NextRequest } from 'next/server'

// ERROR: Missing proper export names (should be GET, POST, etc.)
export function handler(request: NextRequest) {
  return new Response('This is wrong export name')
}

// ERROR: Incorrect function signature
// @ts-ignore
export async function GET(req) {
  // ERROR: Missing Response wrapper
  return { message: 'This should be wrapped in Response' }
}

// ERROR: Using wrong types
// @ts-ignore
export async function POST(request: any) {
  // ERROR: Trying to access body incorrectly
  const body = request.body
  
  // ERROR: Not handling async properly
  const data = request.json()
  
  // ERROR: Wrong return format
  return {
    status: 200,
    body: { message: 'Wrong format' }
  }
}

// ERROR: Using Express.js style in Next.js
// @ts-ignore
export function PUT(req, res) {
  // ERROR: Express style response
  res.status(200).json({ message: 'This is Express style' })
}

// ERROR: Missing async for async operations
export function DELETE(request: NextRequest) {
  // ERROR: Using await without async
  // @ts-ignore
  const data = await request.json()
  
  return new Response(JSON.stringify({ data }))
} 