import './page.css'

import Link from 'next/link'

const errorSamples = [
  {
    id: 'missing-import',
    title: 'Missing Import',
    description: 'Component or function not properly imported',
  },
  {
    id: 'runtime-error',
    title: 'Runtime Error',
    description: 'Uncaught JavaScript runtime errors',
  },
  
  {
    id: 'hydration-mismatch',
    title: 'Hydration Mismatch',
    description: 'Server and client render different content',
  },
  
  {
    id: 'bad-styled-jsx',
    title: 'Bad Usage of styled-jsx',
    description: 'Using styled-jsx on RSC page',
  },
  
  {
    id: 'invalid-hooks',
    title: 'Invalid Hook Usage',
    description: 'Hooks used conditionally or outside components',
  },

  {
    id: 'rsc-prop-error',
    title: 'RSC Prop Error',
    description: 'Passing function prop to client component',
  },

  // {
  //   id: 'async-errors',
  //   title: 'Async & Network Errors',
  //   description: 'JSON parsing, fetch failures, and promise rejections',
  // },
  // {
  //   id: 'api-route-error',
  //   title: 'API Route Error',
  //   description: 'Wrong HTTP methods or missing exports',
  // },
  
  // {
  //   id: 'router-error',
  //   title: 'Router Context Error',
  //   description: 'useRouter used outside Next.js context',
  // },
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
            </div>
            <p>{sample.description}</p>
            <div className="card-footer">
              <span>Click to test →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 