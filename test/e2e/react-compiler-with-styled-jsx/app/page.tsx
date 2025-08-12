'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [toggle, setToggle] = useState(false)

  let $_: any
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-eval
    $_ = eval('typeof $ !== undefined ? $ : undefined')
  }

  useEffect(() => {
    if (Array.isArray($_)) {
      document.getElementById('react-compiler-enabled-message')!.textContent =
        'React compiler is enabled'
    }
  })

  return (
    <>
      <button className="hello" onClick={() => setToggle((dm) => !dm)}>
        <p>Hello World</p>
        <h1 id="react-compiler-enabled-message" />
      </button>
      <style jsx>{`
        .hello {
          background-color: ${toggle ? '#FF0000' : '#0000FF'};
        }
      `}</style>
    </>
  )
}
