/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    // Force React's experimental build to be used.
    taint: true,
    // reactDebugChannel: true,
  },
}

module.exports = nextConfig
