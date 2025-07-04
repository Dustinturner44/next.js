'use client'

import {
  useSelectedLayoutSegments,
  useSelectedLayoutSegment,
} from 'next/navigation'

export default function Layout({ children, header }) {
  const defaultSegments = useSelectedLayoutSegments()
  const headerSegments = useSelectedLayoutSegments('header')
  const defaultSegment = useSelectedLayoutSegment()
  const headerSegment = useSelectedLayoutSegment('header')

  return (
    <>
      <p id="default-segments">{JSON.stringify(defaultSegments)}</p>
      <p id="header-segments">{JSON.stringify(headerSegments)}</p>
      <p id="default-segment">{JSON.stringify(defaultSegment)}</p>
      <p id="header-segment">{JSON.stringify(headerSegment)}</p>
      <div id="header-slot">{header}</div>
      <div id="children-slot">{children}</div>
    </>
  )
}
