import { LowPriority } from 'next/low-priority'

export default function Page() {
  return (
    <div>
      <h1>Low Priority Test</h1>
      <LowPriority fallback={<div id="content">Fallback Content</div>}>
        <div id="content">Full Content</div>
      </LowPriority>
    </div>
  )
}
