/**
 * Check if debug logging is enabled based on the NEXT_PRIVATE_DEBUG_CACHE environment variable.
 * Debug logging is enabled only if the variable is set to one of: '1', 'true', 'yes' (case-insensitive).
 * It is disabled if set to '0', 'false', 'no', or unset.
 * 
 * @returns true if debug logging should be enabled, false otherwise
 */
export function isDebugCacheEnabled(): boolean {
  const value = process.env.NEXT_PRIVATE_DEBUG_CACHE
  
  if (!value) {
    return false
  }
  
  const normalizedValue = value.toLowerCase().trim()
  return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes'
}