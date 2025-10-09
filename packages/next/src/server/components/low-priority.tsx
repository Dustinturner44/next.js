import * as React from 'react'
import { workAsyncStorage } from '../app-render/work-async-storage.external'

export type LowPriorityWhen = 'auto' | 'always' | 'never'

export interface LowPriorityProps {
  /**
   * When to show the fallback instead of children:
   * - 'auto': Show fallback only on slow network connections (default)
   * - 'always': Always show fallback
   * - 'never': Never show fallback, always show children
   */
  when?: LowPriorityWhen
  /**
   * Content to render when the connection is slow or when="always".
   * Defaults to null.
   */
  fallback?: React.ReactNode
  /**
   * Content to render on fast connections or when when="never"
   */
  children: React.ReactNode
}

/**
 * LowPriority is a server component that conditionally renders children
 * based on network quality indicators.
 *
 * When network is detected as "slow" (based on Client Hints or other signals),
 * the fallback is rendered instead of children. This allows you to:
 * - Skip expensive components on slow connections
 * - Reduce initial payload size for low-bandwidth users
 * - Provide a lighter experience on 2G/3G networks
 *
 * @example
 * ```tsx
 * import { LowPriority } from 'next/low-priority'
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Hero />
 *       <LowPriority fallback={<SimpleRecommendations />}>
 *         <RichRecommendations />
 *       </LowPriority>
 *     </>
 *   )
 * }
 * ```
 */
export function LowPriority({
  when = 'auto',
  fallback = null,
  children,
}: LowPriorityProps): React.ReactElement {
  // Force this to be a server component
  if (typeof window !== 'undefined') {
    throw new Error(
      'LowPriority is a server component and cannot be used on the client.'
    )
  }

  // Handle 'never' case - always show children
  if (when === 'never') {
    return <>{children}</>
  }

  // Handle 'always' case - always show fallback
  if (when === 'always') {
    return <>{fallback}</>
  }

  // Handle 'auto' case - check network profile
  const store = workAsyncStorage.getStore()
  const networkProfile = store?.networkProfile

  // If no network profile is available, show children (fast path default)
  const isSlow = networkProfile?.slow ?? false

  return <>{isSlow ? fallback : children}</>
}
