import { createDefaultCacheHandler } from './default'

/**
 * Used for edge runtime compatibility.
 *
 * @deprecated Use createDefaultCacheHandler instead.
 */

export { createDefaultCacheHandler }

// Export a default instance for backward compatibility
export default createDefaultCacheHandler(50 * 1024 * 1024)
