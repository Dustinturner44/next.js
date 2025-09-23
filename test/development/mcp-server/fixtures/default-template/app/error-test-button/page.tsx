'use client'

import { useState } from 'react'

export default function ErrorTestButtonPage() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('Test error for stack frame resolution triggered by button')
  }

  return (
    <div>
      <h1>Click to trigger error</h1>
      <button id="trigger-error-button" onClick={() => setShouldError(true)}>
        Trigger Error
      </button>
    </div>
  )
}
