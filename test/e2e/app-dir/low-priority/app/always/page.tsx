import { LowPriority } from 'next/low-priority'

export default function AlwaysPage() {
  return (
    <div>
      <h1>Always Fallback</h1>
      <LowPriority when="always" fallback={<div>Always Fallback</div>}>
        <div>Full Content</div>
      </LowPriority>
    </div>
  )
}
