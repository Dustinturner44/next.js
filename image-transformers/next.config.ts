export default {
  images: {
    // loader: 'custom',
    // loaderFile: './image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.vercel.com',
        pathname: '/image/**',
      },
    ],
  }
}