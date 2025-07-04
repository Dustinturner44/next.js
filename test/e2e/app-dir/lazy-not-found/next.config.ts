import type { NextConfig } from 'next'

export default {
  experimental: {
    clientSegmentCache: true,
  },
} satisfies NextConfig
