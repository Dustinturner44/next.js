import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'
import { withMicrofrontends } from '@vercel/microfrontends/next/config'

const withMDX = createMDX()

const config: NextConfig = {
  reactStrictMode: true,
}

export default withMicrofrontends(withMDX(config))
