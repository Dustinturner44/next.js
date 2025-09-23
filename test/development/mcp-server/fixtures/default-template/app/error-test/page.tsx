'use client'

export default function ErrorTestPage() {
  // This will throw an error when the component renders
  if (typeof window !== 'undefined') {
    throw new Error('Test error for stack frame resolution')
  }

  return <div>This page will throw an error</div>
}
