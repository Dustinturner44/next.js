'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function ImageErrorPage() {
  return (
    <div className="container">
      <header className="header">
        <Link href="/error-samples" className="back-link">← Back to Error Samples</Link>
        <h1>Next.js Image Component Errors</h1>
        <p>This page immediately shows broken Image components</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>🔴 Active Image Component Errors</h2>
          <ul>
            <li>Image without required width/height properties</li>
            <li>Image with broken/invalid source paths</li>
            <li>Image missing required alt text</li>
            <li>Remote image without domain configuration</li>
          </ul>
        </div>

        <div className="error-showcase">
          <h3>Broken Image Examples</h3>
          
          <div className="error-item">
            <h4>❌ Missing Width/Height:</h4>
            <div className="error-content">
              {/* This will cause an error - missing width/height */}
              {/* @ts-ignore - intentional Image error */}
              <Image src="/test.jpg" alt="Test image without dimensions" />
            </div>
          </div>

          <div className="error-item">
            <h4>❌ Broken Image Source:</h4>
            <div className="error-content">
              <Image 
                src="/non-existent-image-that-will-404.jpg" 
                alt="Broken image"
                width={200}
                height={150}
                style={{ border: '2px solid #dc2626' }}
              />
            </div>
          </div>

          <div className="error-item">
            <h4>⚠️ Missing Alt Text:</h4>
            <div className="error-content">
              <Image 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg=="
                alt="" // Empty alt text - accessibility issue
                width={200}
                height={150}
              />
              <p style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                Accessibility warning: Image missing meaningful alt text
              </p>
            </div>
          </div>

          <div className="error-item">
            <h4>❌ Remote Image Without Configuration:</h4>
            <div className="error-content">
              {/* This will cause an error - remote domain not configured */}
              <Image 
                src="https://example.com/image.jpg" 
                alt="Remote image without domain config"
                width={200}
                height={150}
              />
              <p style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                Error: Remote images require domain configuration
              </p>
            </div>
          </div>

          <div className="error-item">
            <h4>❌ Invalid Props Combination:</h4>
            <div className="error-content">
              {/* This will cause an error - using fill with width/height */}
              {/* @ts-ignore - intentional Image error */}
              <Image 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY0NDQ0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbnZhbGlkPC90ZXh0Pjwvc3ZnPg=="
                alt="Invalid props"
                width={200}
                height={150}
                fill
              />
              <p style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                Error: Cannot use both fill and width/height
              </p>
            </div>
          </div>
        </div>

        <div className="code-example">
          <h3>Problem Code (Currently Active):</h3>
          <pre>{`// ❌ These Image errors are active on this page:

// Missing width/height properties
<Image src="/test.jpg" alt="Test" />

// Broken image source (404)
<Image 
  src="/non-existent-image-that-will-404.jpg" 
  alt="Broken"
  width={200} 
  height={150} 
/>

// Missing alt text (accessibility issue)
<Image 
  src="/image.jpg" 
  alt="" 
  width={200} 
  height={150} 
/>

// Remote image without domain configuration
<Image 
  src="https://example.com/image.jpg" 
  alt="Remote"
  width={200} 
  height={150} 
/>

// Invalid props combination
<Image 
  src="/image.jpg" 
  alt="Invalid"
  width={200} 
  height={150}
  fill // Cannot use with width/height
/>

// ✅ Correct Image usage:

import Image from 'next/image'

// Proper local image
<Image 
  src="/hero.jpg" 
  alt="Hero section showing our main product"
  width={500} 
  height={300}
  priority
/>

// Responsive with fill
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image 
    src="/hero.jpg" 
    alt="Hero section"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// Remote image with configuration (in next.config.js)
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}`}</pre>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .header {
          margin-bottom: 2rem;
        }

        .back-link {
          color: #0070f3;
          text-decoration: none;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .header h1 {
          font-size: 2rem;
          font-weight: 600;
          margin: 0.5rem 0;
          color: #1a1a1a;
        }

        .header p {
          color: #666;
          margin: 0;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .explanation {
          background: #fee2e2;
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid #dc2626;
        }

        .explanation h2 {
          margin: 0 0 1rem 0;
          color: #dc2626;
        }

        .explanation ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .explanation li {
          margin-bottom: 0.5rem;
          color: #7f1d1d;
        }

        .error-showcase {
          border: 2px solid #dc2626;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fef2f2;
        }

        .error-showcase h3 {
          margin: 0 0 1.5rem 0;
          color: #dc2626;
        }

        .error-item {
          margin-bottom: 2rem;
          padding: 1rem;
          background: white;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }

        .error-item:last-child {
          margin-bottom: 0;
        }

        .error-item h4 {
          margin: 0 0 0.75rem 0;
          color: #991b1b;
          font-size: 1rem;
        }

        .error-content {
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .code-example {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 1.5rem;
          color: white;
        }

        .code-example h3 {
          margin: 0 0 1rem 0;
          color: white;
        }

        .code-example pre {
          margin: 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
} 