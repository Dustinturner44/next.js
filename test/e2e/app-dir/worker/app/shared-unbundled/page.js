'use client'
import { useState } from 'react'

export default function SharedWorkerPage() {
  const [state, setState] = useState('default')
  return (
    <div>
      <button
        onClick={() => {
          const worker = new SharedWorker('/unbundled-shared-worker.js')
          worker.port.addEventListener('message', (event) => {
            setState(event.data)
          })
          worker.port.start()
        }}
      >
        Get shared worker data
      </button>
      <p>SharedWorker state: </p>
      <p id="shared-worker-state">{state}</p>
    </div>
  )
}
