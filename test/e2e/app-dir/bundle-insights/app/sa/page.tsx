'use client'

import { redirectAction } from './actions'

export default function Page() {
  return (
    <div>
      <p>sa</p>
      <button onClick={redirectAction}>redirect</button>
    </div>
  )
}
