'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ImageErrorPage() {
  const [errorType, setErrorType] = useState<string | null>(null)

  const triggerMissingDimensions = () => {
    setErrorType('Missing Dimensions')
    // This will cause an error in the console
    try {
      // This would error: Image requires width and height props
      // Simulated by showing the error concept
      throw new Error('Image with src "/test.jpg" must use "width" and "height" properties or "fill" property.')
    } catch (error) {
      console.error('Image error:', error)
      // Don't rethrow to keep demo working
    }
  }

  const triggerInvalidSrc = () => {
    setErrorType('Invalid Source')
    // This will show broken image
    // We'll use a broken URL to demonstrate
  }

  const triggerMissingAlt = () => {
    setErrorType('Missing Alt Text')
    // This will show accessibility warnings
  }

  const triggerUnoptimizedRemote = () => {
    setErrorType('Unoptimized Remote Image')
    // This will show remote image without domain configuration
  }

  const clearError = () => {
    setErrorType(null)
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-link">← Back to Error Samples</Link>
        <h1>Next.js Image Component Errors</h1>
        <p>This page demonstrates common mistakes when using the Next.js Image component</p>
      </header>

      <div className="content">
        <div className="explanation">
          <h2>Common Image Component Issues</h2>
          <ul>
            <li><strong>Missing dimensions:</strong> Image requires width/height or fill property</li>
            <li><strong>Invalid source paths:</strong> Broken or incorrect image URLs</li>
            <li><strong>Missing alt text:</strong> Accessibility requirement for screen readers</li>
            <li><strong>Remote images:</strong> External domains not configured in next.config.js</li>
            <li><strong>Performance issues:</strong> Not using Next.js optimization features properly</li>
          </ul>
        </div>

        <div className="demo">
          <h3>Interactive Demo</h3>
          <div className="demo-content">
            <p>Current status: {errorType ? `${errorType} error active` : 'No error active'}</p>
            
            <div className="image-showcase">
              {errorType === 'Missing Dimensions' && (
                <div className="error-example">
                  <h4>❌ Missing Width/Height:</h4>
                  <div className="error-message">
                    Image requires width and height properties when not using fill
                  </div>
                  <code>{`<Image src="/test.jpg" alt="test" />`}</code>
                </div>
              )}

              {errorType === 'Invalid Source' && (
                <div className="error-example">
                  <h4>❌ Broken Image Source:</h4>
                  <Image 
                    src="/non-existent-image.jpg" 
                    alt="Broken image"
                    width={200}
                    height={150}
                    style={{ border: '2px solid #dc2626' }}
                  />
                  <p>Image fails to load due to invalid source path</p>
                </div>
              )}

              {errorType === 'Missing Alt Text' && (
                <div className="error-example">
                  <h4>⚠️ Missing Alt Text:</h4>
                  <Image 
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg=="
                    alt="" // Empty alt text - accessibility issue
                    width={200}
                    height={150}
                  />
                  <p>Accessibility warning: Image missing meaningful alt text</p>
                </div>
              )}

              {errorType === 'Unoptimized Remote Image' && (
                <div className="error-example">
                  <h4>❌ Remote Image Domain Issue:</h4>
                  <div className="error-message">
                    Remote images require domain configuration in next.config.js
                  </div>
                  <code>{`// next.config.js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'example.com',
    },
  ],
}`}</code>
                </div>
              )}

              {!errorType && (
                <div className="good-example">
                  <h4>✅ Properly Configured Image:</h4>
                  <Image 
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGY5ODhlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5PcHRpbWl6ZWQ8L3RleHQ+PC9zdmc+"
                    alt="Properly optimized image with correct dimensions and alt text"
                    width={200}
                    height={150}
                    priority
                  />
                  <p>Includes width, height, meaningful alt text, and optimization</p>
                </div>
              )}
            </div>

            <div className="controls">
              <div className="button-grid">
                <button onClick={triggerMissingDimensions} className="error-btn dimensions">
                  Missing Dimensions
                </button>
                <button onClick={triggerInvalidSrc} className="error-btn source">
                  Invalid Source
                </button>
                <button onClick={triggerMissingAlt} className="error-btn alt">
                  Missing Alt
                </button>
                <button onClick={triggerUnoptimizedRemote} className="error-btn remote">
                  Remote Domain
                </button>
                <button onClick={clearError} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>

            {errorType && (
              <div className="warning">
                <strong>⚠️ {errorType} Error Active</strong>
                <p>Check the console and inspect element for Image component errors and warnings.</p>
              </div>
            )}
          </div>
        </div>

        <div className="code-example">
          <h3>Image Component Best Practices:</h3>
          <pre>{`// ❌ Missing required properties
<Image src="/hero.jpg" alt="Hero" />

// ❌ Missing alt text
<Image src="/hero.jpg" width={500} height={300} />

// ❌ Remote image without configuration
<Image 
  src="https://external-site.com/image.jpg" 
  width={500} 
  height={300}
  alt="External image" 
/>

// ✅ Properly configured local image
<Image 
  src="/hero.jpg" 
  alt="Hero section showing our main product"
  width={500} 
  height={300}
  priority // For above-the-fold images
/>

// ✅ Responsive image with fill
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image 
    src="/hero.jpg" 
    alt="Hero section"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// ✅ Remote image with proper configuration
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

// Component
<Image 
  src="https://images.unsplash.com/photo-xyz" 
  alt="Beautiful landscape"
  width={500} 
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
/>`}</pre>
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
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 4px solid #0070f3;
        }

        .explanation h2 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
        }

        .explanation ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .explanation li {
          margin-bottom: 0.5rem;
        }

        .demo {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .demo h3 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
        }

        .image-showcase {
          margin: 1.5rem 0;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .error-example, .good-example {
          text-align: center;
          padding: 1rem;
          border-radius: 8px;
          width: 100%;
        }

        .error-example {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .good-example {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .error-example h4 {
          color: #dc2626;
          margin: 0 0 1rem 0;
        }

        .good-example h4 {
          color: #059669;
          margin: 0 0 1rem 0;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 0.75rem;
          margin: 1rem 0;
          color: #dc2626;
          font-weight: 500;
        }

        .error-example code, .error-message + code {
          display: block;
          background: #1f2937;
          color: #f9fafb;
          padding: 0.75rem;
          border-radius: 4px;
          margin: 0.75rem 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9rem;
        }

        .controls {
          margin: 1.5rem 0;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .error-btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
          font-size: 0.9rem;
        }

        .error-btn.dimensions {
          background: #dc2626;
        }

        .error-btn.dimensions:hover {
          background: #b91c1c;
        }

        .error-btn.source {
          background: #ea580c;
        }

        .error-btn.source:hover {
          background: #c2410c;
        }

        .error-btn.alt {
          background: #059669;
        }

        .error-btn.alt:hover {
          background: #047857;
        }

        .error-btn.remote {
          background: #7c3aed;
        }

        .error-btn.remote:hover {
          background: #6d28d9;
        }

        .clear-btn {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .warning strong {
          color: #92400e;
        }

        .warning p {
          margin: 0.5rem 0 0 0;
          color: #92400e;
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

          .button-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
} 