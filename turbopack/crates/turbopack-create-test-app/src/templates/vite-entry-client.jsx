import React from 'react'
import ReactDOM from 'react-dom/client'
import Triangle from './triangle.jsx'

let originalColor = 'black'
let isToggled = false

function manipulateParent() {
  if (isToggled) {
    document.body.style.backgroundColor = originalColor
    isToggled = false
  } else {
    document.body.style.backgroundColor = 'red'
    isToggled = true
  }
}

function App() {
  React.useEffect(() => {
    globalThis.__turbopackBenchBinding &&
      globalThis.__turbopackBenchBinding('Hydration done')
  })
  return (
    <svg height="100%" viewBox="-5 -4.33 10 8.66" style={{}}>
      <Triangle style={{ fill: 'white' }} onClick={manipulateParent} />
    </svg>
  )
}

document.body.style.backgroundColor = originalColor

ReactDOM.hydrateRoot(document.getElementById('app'), <App />)
