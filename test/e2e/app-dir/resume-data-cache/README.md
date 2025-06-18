# Resume Data Cache E2E Tests

This directory contains comprehensive end-to-end tests for Next.js's `resume-data-cache` module, which is a critical component of the Partial Prerendering (PPR) system.

## Overview

The `resume-data-cache` module enables Next.js to cache and resume data between different rendering phases, particularly for:

- **Prerendering**: Caching data during static generation
- **Dynamic Rendering**: Resuming from cached data when handling dynamic requests
- **PPR (Partial Prerendering)**: Streaming static shells immediately while postponing dynamic content

## Test Structure

### Main Test File

- `resume-data-cache.test.ts` - Comprehensive test suite with 16 test cases

### Test App Structure

```
app/
├── layout.tsx                          # Root layout
├── static-with-cache/                  # Static pages with cached data
├── dynamic-with-cache/                 # Dynamic pages with caching
├── fetch-cache/                        # Fetch API caching tests
├── fetch-options/                      # Different fetch cache options
├── use-cache-function/                 # "use cache" directive tests
├── cache-tags/                         # Cache tagging and revalidation
├── server-function-with-args/          # Server actions with encrypted args
├── ppr-with-cache/                     # PPR streaming tests
├── ppr-resume-test/                    # PPR resume functionality
├── cache-with-non-serializable/        # Error handling for serialization
├── cache-error-boundary/               # Error boundary testing
├── large-cache-test/                   # Large payload compression
├── persisted-cache/                    # Cache persistence tests
├── concurrent-cache-test/              # Concurrent access tests
├── no-cache/                           # Control case (no caching)
└── api/revalidate-tag/                 # API for cache revalidation
```

### Configuration

- `next.config.js` - Enables PPR and useCache experimental features
- `measure-ppr-timings.ts` - Utility for measuring streaming performance

## Test Categories

### 1. Cache Creation and Storage (2 tests)

- **Purpose**: Verify cache creation during static generation
- **Tests**:
  - Cache population during prerendering
  - Serialization and compression of cache data

### 2. Cache Restoration and Usage (2 tests)

- **Purpose**: Verify cache restoration during dynamic rendering
- **Tests**:
  - Cache restoration from serialized data
  - Empty cache handling

### 3. Fetch Cache Integration (2 tests)

- **Purpose**: Test fetch API integration with resume data cache
- **Tests**:
  - Fetch response caching
  - Different fetch cache options (force-cache, no-store)

### 4. Use Cache Directive Integration (2 tests)

- **Purpose**: Test the "use cache" React directive
- **Tests**:
  - Function-level caching with "use cache"
  - Cache tags and revalidation

### 5. Encrypted Bound Args (1 test)

- **Purpose**: Test server actions with encrypted arguments
- **Tests**:
  - Server function argument encryption and storage

### 6. PPR Streaming with Resume Data (2 tests)

- **Purpose**: Test Partial Prerendering with cached data
- **Tests**:
  - Static shell streaming with postponed dynamic content
  - Resume rendering with cached data

### 7. Edge Cases and Error Handling (3 tests)

- **Purpose**: Test error scenarios and edge cases
- **Tests**:
  - Non-serializable data handling
  - Error boundary functionality
  - Large cache payload compression

### 8. Production-specific Tests (2 tests)

- **Purpose**: Test production-specific behaviors
- **Tests**:
  - Cache persistence across server restarts
  - Concurrent cache access handling

## Key Features Tested

### Cache Data Types

- **Fetch Cache**: HTTP response caching
- **Use Cache**: Function-level caching with the "use cache" directive
- **Encrypted Bound Args**: Server action argument encryption
- **Decrypted Bound Args**: In-memory decrypted arguments

### Cache Operations

- **Serialization**: Converting cache data to compressed base64 strings
- **Deserialization**: Restoring cache from serialized data
- **Compression**: Using zlib for efficient storage
- **Revalidation**: Cache invalidation by tags or time

### PPR Integration

- **Static Shell Streaming**: Immediate delivery of static content
- **Dynamic Content Postponing**: Delayed rendering of dynamic parts
- **Resume Rendering**: Continuing from cached state

## Running the Tests

### Prerequisites

```bash
# Build the Next.js repository
pnpm build
```

### Test Execution

```bash
# Run all resume data cache tests
pnpm test-start test/e2e/app-dir/resume-data-cache/

# Run with specific test pattern
pnpm test-start test/e2e/app-dir/resume-data-cache/resume-data-cache.test.ts

# Run in development mode (will skip PPR tests)
pnpm test-dev test/e2e/app-dir/resume-data-cache/
```

### Test Environment

- **Mode**: Production (`test-start`) - PPR requires production builds
- **Isolation**: Tests run in isolated Next.js installations
- **Cleanup**: Temporary directories are cleaned up after tests

## Implementation Details

### Cache Architecture

The resume data cache consists of two main interfaces:

1. **PrerenderResumeDataCache**: Mutable cache used during prerendering

   - Allows both read and write operations
   - Builds cache during static generation

2. **RenderResumeDataCache**: Immutable cache used during rendering
   - Read-only operations only
   - Used for fast lookups during dynamic requests

### Serialization Format

```typescript
type ResumeStoreSerialized = {
  store: {
    cache: { [key: string]: any } // Use cache entries
    fetch: { [key: string]: any } // Fetch responses
    encryptedBoundArgs: { [key: string]: string } // Server action args
  }
}
```

### Compression

- Uses Node.js `zlib.deflateSync` for compression
- Base64 encoding for storage/transmission
- Automatic decompression during restoration

## Key Testing Patterns

### Cache Hit Detection

```typescript
// Compare timestamps to detect cache hits
const firstCall = await getCachedData()
const secondCall = await getCachedData()
const cacheHit = firstCall.timestamp === secondCall.timestamp
```

### PPR Content Verification

```typescript
// Verify both static and dynamic content presence
expect(html).toContain('Static Shell')
expect(html).toContain('Dynamic Content')
```

### Error Boundary Testing

```typescript
// Test initial state and error trigger setup
expect(html).toContain('No error occurred')
expect(html).toContain('Trigger Error')
```

## Debugging

### Meta File Inspection

The tests attempt to read `.meta` files for debugging:

```typescript
const meta = await next.readFile('.next/server/app/page-name.meta')
const metadata = JSON.parse(meta)
```

Note: Meta files may not always be generated in test environments.

### Console Output

Tests include console logging for debugging:

- "Meta file not found, skipping metadata check"
- "Meta file not found or parsing failed, skipping serialization test"

## Related Documentation

- [Next.js PPR Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/partial-prerendering)
- [Use Cache Directive](https://nextjs.org/docs/canary/app/api-reference/directives/use-cache)
- [Server Actions](https://nextjs.org/docs/app/api-reference/functions/server-actions)
- [Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)

## Contributing

When adding new tests:

1. Follow the existing directory structure
2. Use `unstable_cache` for proper caching behavior
3. Test both success and error cases
4. Include proper TypeScript types
5. Add descriptive test names and comments
6. Ensure tests work in production mode
