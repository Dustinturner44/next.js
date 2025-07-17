import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Project Board - Task Management',
  description: 'A powerful project management tool with drag-and-drop task boards for organizing your work efficiently.',
  keywords: 'project management, task board, kanban, productivity, todo',
  authors: [{ name: 'Next.js Team' }],
  creator: 'Next.js',
  publisher: 'Vercel',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://example.com/project-board',
    siteName: 'Project Board App',
    title: 'Project Board - Organize Your Tasks Efficiently',
    description: 'Boost your productivity with our intuitive drag-and-drop task management system. Create, organize, and track your projects with ease.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Project Board Preview',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Board - Task Management Made Simple',
    description: 'Organize your work with our intuitive drag-and-drop task boards. Perfect for teams and individuals.',
    images: ['https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop'],
    creator: '@nextjs',
    site: '@vercel',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0a0a0a',
}

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body
        style={{
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          margin: 0,
          padding: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  )
}