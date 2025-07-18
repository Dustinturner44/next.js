'use client'

export function ClientButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}>Client Button: Click me</button>
  )
}