import { isDebugCacheEnabled } from '../debug-utils'

describe('isDebugCacheEnabled', () => {
  const originalEnv = process.env.NEXT_PRIVATE_DEBUG_CACHE

  afterEach(() => {
    // Restore original value
    if (originalEnv === undefined) {
      delete process.env.NEXT_PRIVATE_DEBUG_CACHE
    } else {
      process.env.NEXT_PRIVATE_DEBUG_CACHE = originalEnv
    }
  })

  it('should return true for "1"', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = '1'
    expect(isDebugCacheEnabled()).toBe(true)
  })

  it('should return true for "true" (case-insensitive)', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'true'
    expect(isDebugCacheEnabled()).toBe(true)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'TRUE'
    expect(isDebugCacheEnabled()).toBe(true)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'True'
    expect(isDebugCacheEnabled()).toBe(true)
  })

  it('should return true for "yes" (case-insensitive)', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'yes'
    expect(isDebugCacheEnabled()).toBe(true)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'YES'
    expect(isDebugCacheEnabled()).toBe(true)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'Yes'
    expect(isDebugCacheEnabled()).toBe(true)
  })

  it('should handle whitespace correctly', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = ' true '
    expect(isDebugCacheEnabled()).toBe(true)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = ' 1 '
    expect(isDebugCacheEnabled()).toBe(true)
  })

  it('should return false for "0"', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = '0'
    expect(isDebugCacheEnabled()).toBe(false)
  })

  it('should return false for "false" (case-insensitive)', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'false'
    expect(isDebugCacheEnabled()).toBe(false)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'FALSE'
    expect(isDebugCacheEnabled()).toBe(false)
  })

  it('should return false for "no" (case-insensitive)', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'no'
    expect(isDebugCacheEnabled()).toBe(false)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'NO'
    expect(isDebugCacheEnabled()).toBe(false)
  })

  it('should return false when undefined', () => {
    delete process.env.NEXT_PRIVATE_DEBUG_CACHE
    expect(isDebugCacheEnabled()).toBe(false)
  })

  it('should return false for empty string', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = ''
    expect(isDebugCacheEnabled()).toBe(false)
  })

  it('should return false for arbitrary values', () => {
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'arbitrary'
    expect(isDebugCacheEnabled()).toBe(false)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = 'debug'
    expect(isDebugCacheEnabled()).toBe(false)
    
    process.env.NEXT_PRIVATE_DEBUG_CACHE = '2'
    expect(isDebugCacheEnabled()).toBe(false)
  })
})