import { workAsyncStorage } from '../app-render/work-async-storage.external'
import type { NetworkProfile } from '../app-render/network-profile'

/**
 * Get the network profile information for the current request.
 *
 * This function provides access to network quality indicators including:
 * - ECT (Effective Connection Type): slow-2g, 2g, 3g, or 4g
 * - RTT (Round Trip Time) in milliseconds
 * - Downlink bandwidth in Mbps
 * - Save-Data preference
 * - slow: boolean indicating if the connection is considered slow
 *
 * The information is derived from Client Hints headers sent by the browser.
 * Not all browsers support these headers, so values may be undefined.
 *
 * @returns The network profile for the current request
 * @throws Error if called outside of a request context
 *
 * @example
 * ```tsx
 * import { network } from 'next/server'
 *
 * export default function Page() {
 *   const net = network()
 *
 *   if (net.slow) {
 *     return <LightweightVersion />
 *   }
 *
 *   return <FullExperience />
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { network } from 'next/server'
 *
 * export default function Page() {
 *   const { ect, rtt, downlink, saveData } = network()
 *
 *   console.log('Connection type:', ect) // 'slow-2g' | '2g' | '3g' | '4g'
 *   console.log('Round trip time:', rtt) // milliseconds
 *   console.log('Downlink speed:', downlink) // Mbps
 *   console.log('Save data enabled:', saveData) // boolean
 * }
 * ```
 */
export function network(): NetworkProfile {
  const store = workAsyncStorage.getStore()

  if (!store) {
    throw new Error(
      'network() can only be called from a Server Component or Server Action.'
    )
  }

  // Return a default profile if network profile is not available
  return (
    store.networkProfile ?? {
      slow: false,
    }
  )
}
