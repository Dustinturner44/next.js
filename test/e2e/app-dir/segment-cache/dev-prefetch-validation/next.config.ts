import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    cacheComponents: true,
    clientSegmentCache: true,
    clientParamParsing: true,
  },
  productionBrowserSourceMaps: true,
}

export default nextConfig
