'use client'

import { useState } from 'react'
import { processInput } from './actions'

export default function ServerFunctionWithArgsPage() {
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const input = formData.get('input') as string

    const response = await processInput(input)
    setResult(response)
  }

  return (
    <div>
      <h1>Server Function with Args</h1>
      <form onSubmit={handleSubmit}>
        <input name="input" defaultValue="test-input" />
        <button type="submit">Process</button>
      </form>
      {result && (
        <div>
          <p>Processed: {result.processed}</p>
          <p>Timestamp: {result.timestamp}</p>
        </div>
      )}
    </div>
  )
}
