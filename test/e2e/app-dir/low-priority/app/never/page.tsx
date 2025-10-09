import { LowPriority } from 'next/low-priority'

export default function NeverPage() {
  return (
    <div>
      <h1>Never Skip</h1>
      <LowPriority when="never" fallback={<div>Never Fallback</div>}>
        <div>Never Skipped Content</div>
      </LowPriority>
    </div>
  )
}
