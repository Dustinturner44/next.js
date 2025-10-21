'use client'
import { useState } from 'react'

export default function SharedWorkerBundledPage() {
  const [state, setState] = useState('default')
  return (
    <div>
      <button
        onClick={() => {
          // This should be bundled by turbopack since it's a relative import
          const worker = new SharedWorker(
            new URL('../shared-worker', import.meta.url)
          )
          worker.port.addEventListener('message', (event) => {
            setState(event.data)
          })
          worker.port.start()
        }}
      >
        Get shared worker data (bundled)
      </button>
      <p>SharedWorker bundled state: </p>
      <p id="shared-worker-bundled-state">{state}</p>
    </div>
  )
}
