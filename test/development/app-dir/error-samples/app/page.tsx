// TEST CASE: try to comment out the use client directive and see if the auto fix workss
'use client';

import Link from 'next/link'

const errorSamples = [
  {
    id: 'hydration-mismatch',
    title: 'Hydration Mismatch',
    description: 'Server and client render different content',
    severity: 'High'
  },
  {
    id: 'missing-import',
    title: 'Missing Import',
    description: 'Component or function not properly imported',
    severity: 'Medium'
  },
  {
    id: 'client-side-only',
    title: 'Client-Side Only Code',
    description: 'Using window/document on server side',
    severity: 'High'
  },
  {
    id: 'invalid-hooks',
    title: 'Invalid Hook Usage',
    description: 'Hooks used conditionally or outside components',
    severity: 'High'
  },
  {
    id: 'async-component',
    title: 'Async Component Error',
    description: 'Trying to make components async incorrectly',
    severity: 'Medium'
  },
  {
    id: 'api-route-error',
    title: 'API Route Error',
    description: 'Wrong HTTP methods or missing exports',
    severity: 'Medium'
  },
  {
    id: 'dynamic-import',
    title: 'Dynamic Import Error',
    description: 'Incorrect dynamic import usage',
    severity: 'Low'
  },
  {
    id: 'image-error',
    title: 'Next.js Image Error',
    description: 'Incorrect Image component usage',
    severity: 'Medium'
  },
  {
    id: 'router-error',
    title: 'Router Context Error',
    description: 'useRouter used outside Next.js context',
    severity: 'High'
  },
  {
    id: 'runtime-error',
    title: 'Runtime Error',
    description: 'Uncaught JavaScript runtime errors',
    severity: 'High'
  }
]

export default function ErrorSamplesPage() {
  return (
    <div className="container">
      <header className="header">
        <h1>Next.js Error Samples</h1>
        <p>Interactive examples of common Next.js errors for testing the auto-fix feature</p>
      </header>

      <div className="grid">
        {errorSamples.map((sample) => (
          <Link key={sample.id} href={`/${sample.id}`} className="card">
            <div className="card-header">
              <h3>{sample.title}</h3>
              <span className={`severity ${sample.severity.toLowerCase()}`}>
                {sample.severity}
              </span>
            </div>
            <p>{sample.description}</p>
            <div className="card-footer">
              <span>Click to test →</span>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
        }

        .header p {
          font-size: 1.1rem;
          color: #666;
          margin: 0;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .card {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          background: #fff;
        }

        .card:hover {
          border-color: #0070f3;
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .severity {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .severity.high {
          background: #fee2e2;
          color: #dc2626;
        }

        .severity.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .severity.low {
          background: #d1fae5;
          color: #059669;
        }

        .card p {
          margin: 0 0 1rem 0;
          color: #666;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .card-footer span {
          font-size: 0.9rem;
          color: #0070f3;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 2rem;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
} 