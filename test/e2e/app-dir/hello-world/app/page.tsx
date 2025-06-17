'use client'

export default function Page() {
  if (typeof window !== 'undefined') {
    console.error('This is a client-side error in the hello world page.')
  }

  return <p>hello world</p>
}
