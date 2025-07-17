// @ts-ignore - Intentional error for testing auto-fix
import { useRouter } from 'next/navigation'

// This will cause an error because useRouter is called outside a component
const router = useRouter()

export default function RouterErrorPage() {
  // This will also cause an error
  const anotherRouter = useRouter()
  
  // Trying to navigate immediately
  router.push('/some-path')
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Router Context Error</h1>
      <p>This page demonstrates incorrect usage of useRouter hook.</p>
      <ul>
        <li>useRouter called outside component (at module level)</li>
        <li>Router methods called during render</li>
        <li>Missing proper React context</li>
      </ul>
      <button onClick={() => router.back()}>
        Go Back (This will also error)
      </button>
    </div>
  )
} 