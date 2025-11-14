/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    taint: true,
  },
}

module.exports = nextConfig
