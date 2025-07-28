import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dark Notes - Minimalist Note-Taking',
  description: 'A sleek, super dark themed note-taking app for focused writing and organization.',
  keywords: 'notes, note-taking, dark theme, minimalist, writing',
  authors: [{ name: 'Next.js Team' }],
  creator: 'Next.js',
  publisher: 'Vercel',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
}

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body
        style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          margin: 0,
          padding: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <script src="http://localhost:8097"></script>
        {children}
      </body>
    </html>
  )
}