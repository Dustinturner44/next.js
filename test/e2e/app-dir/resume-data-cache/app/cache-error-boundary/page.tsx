import React, { Suspense } from 'react'
import { headers } from 'next/headers'
import ClientErrorBoundary from './client-error-boundary'

// Component that uses dynamicIO and can trigger cache-related errors
async function DynamicCacheComponent() {
  const headersList = await headers()
  const shouldError = headersList.get('X-Force-Cache-Error')

  if (shouldError === 'true') {
    // Simulate a cache serialization error
    throw new Error(
      'Cache serialization failed: Non-serializable data encountered'
    )
  }

  // Use "use cache" directive with dynamic headers
  const getCachedHeaderData = async function () {
    'use cache'
    const timestamp = Date.now()
    const userAgent = headersList.get('user-agent') || 'unknown'
    return {
      timestamp,
      userAgent: userAgent.substring(0, 50), // Truncate for serialization
      cached: true,
      dynamicIO: true,
    }
  }

  const cachedData = await getCachedHeaderData()

  return (
    <div id="dynamic-cache-content" data-dynamic-io="true">
      <h3>Dynamic Cache Component</h3>
      <p>Timestamp: {cachedData.timestamp}</p>
      <p>User Agent: {cachedData.userAgent}</p>
      <p>Cached: {cachedData.cached ? 'YES' : 'NO'}</p>
      <p>DynamicIO Enabled: {cachedData.dynamicIO ? 'YES' : 'NO'}</p>
    </div>
  )
}

// Component that demonstrates cache errors with corrupted data
async function CorruptedCacheComponent() {
  const headersList = await headers()
  const forceCorruption = headersList.get('X-Force-Corruption')

  const getCorruptibleData = async function () {
    'use cache'
    if (forceCorruption === 'true') {
      // Simulate corrupted cache data by creating circular reference
      const obj: any = { data: 'test' }
      obj.circular = obj
      return obj // This will fail during serialization
    }

    return { data: 'valid cache data', timestamp: Date.now() }
  }

  try {
    const data = await getCorruptibleData()
    return (
      <div id="corrupted-cache-content">
        <h3>Corrupted Cache Test</h3>
        <p>Data: {JSON.stringify(data, null, 2)}</p>
      </div>
    )
  } catch (error) {
    throw new Error(
      `Cache corruption detected: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export default function CacheErrorBoundaryPage() {
  return (
    <div>
      <h1>Cache Error Boundary Test</h1>
      <p>This page demonstrates cache error handling with dynamicIO enabled.</p>

      <ClientErrorBoundary>
        <Suspense
          fallback={<div id="cache-loading">Loading cache data...</div>}
        >
          <DynamicCacheComponent />
        </Suspense>
      </ClientErrorBoundary>

      <ClientErrorBoundary>
        <Suspense
          fallback={
            <div id="corruption-loading">Loading corruption test...</div>
          }
        >
          <CorruptedCacheComponent />
        </Suspense>
      </ClientErrorBoundary>

      <div id="test-instructions">
        <h3>Test Instructions</h3>
        <p>To trigger errors, send requests with headers:</p>
        <ul>
          <li>
            X-Force-Cache-Error: true (triggers cache serialization error)
          </li>
          <li>X-Force-Corruption: true (triggers cache corruption error)</li>
        </ul>
      </div>
    </div>
  )
}
