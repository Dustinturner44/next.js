/** @type {import('next').NextConfig} */
module.exports = {
  // Explicitly configure deprecated options
  skipProxyUrlNormalize: true,
  experimental: {
    proxyPrefetch: 'strict',
    instrumentationHook: true,
    proxyClientMaxBodySize: '5mb',
    externalProxyRewritesResolve: true,
  },
}
