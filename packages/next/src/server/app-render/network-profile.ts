export type NetworkEffectiveConnectionType =
  | 'slow-2g'
  | '2g'
  | '3g'
  | '4g'
  | undefined

export type NetworkBackpressure = 'none' | 'low' | 'high'

export interface NetworkProfile {
  ect?: NetworkEffectiveConnectionType
  rtt?: number // milliseconds
  downlink?: number // Mbps
  saveData?: boolean
  backpressure?: NetworkBackpressure
  slow: boolean
}

export type NetworkProfileInput = Omit<NetworkProfile, 'slow'>

/**
 * Determines if the network should be considered "slow" based on the profile.
 * A network is considered slow if any of the following conditions are met:
 * - Save-Data header is enabled
 * - ECT is slow-2g or 2g
 * - RTT is greater than 800ms
 * - Downlink is less than 1.5 Mbps (if available)
 * - Backpressure is high
 */
export function decideSlow(profile: NetworkProfileInput): boolean {
  const ectSlow = profile.ect === 'slow-2g' || profile.ect === '2g'
  const rttSlow = (profile.rtt ?? 0) > 800
  const dlSlow =
    profile.downlink !== undefined &&
    profile.downlink > 0 &&
    profile.downlink < 1.5
  const bpSlow = profile.backpressure === 'high'

  return profile.saveData === true || ectSlow || rttSlow || dlSlow || bpSlow
}

/**
 * Extract network hints from request headers.
 * These headers are sent by browsers that support Network Information API Client Hints.
 */
export function extractNetworkHints(
  headers:
    | Headers
    | Map<string, string | string[] | undefined>
    | Record<string, string | string[] | undefined>
): NetworkProfileInput {
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name)?.toLowerCase() || undefined
    }
    if (headers instanceof Map) {
      const value = headers.get(name)
      if (typeof value === 'string') return value.toLowerCase()
      if (Array.isArray(value)) return value[0]?.toLowerCase()
      return undefined
    }
    // Handle plain object (IncomingHttpHeaders)
    const value = headers[name]
    if (typeof value === 'string') return value.toLowerCase()
    if (Array.isArray(value)) return value[0]?.toLowerCase()
    return undefined
  }

  const saveDataValue = getHeader('save-data')
  const ectValue = getHeader('ect')
  const downlinkValue = getHeader('downlink')
  const rttValue = getHeader('rtt')

  return {
    saveData: saveDataValue === 'on',
    ect: ectValue as NetworkEffectiveConnectionType,
    downlink: downlinkValue ? Number(downlinkValue) : undefined,
    rtt: rttValue ? Number(rttValue) : undefined,
  }
}

/**
 * Creates a complete network profile with the slow determination.
 */
export function createNetworkProfile(
  input: NetworkProfileInput
): NetworkProfile {
  return {
    ...input,
    slow: decideSlow(input),
  }
}
