/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    dynamicIO: true,
    prerenderEarlyExit: false,
    enablePrerenderSourceMaps: true,
    serverSourceMaps: true,
  },
}

module.exports = nextConfig
