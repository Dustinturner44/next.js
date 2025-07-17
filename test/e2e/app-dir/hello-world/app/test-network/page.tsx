'use client';

import { useState } from 'react';

export default function TestNetworkPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testGet = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-fetch');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  const testPost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test from Network Viewer',
          body: 'Testing the network interception'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to post' });
    }
    setLoading(false);
  };

  const testExternal = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.github.com/repos/vercel/next.js');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch external' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Network Test Page</h1>
      <p>Click the buttons below to generate network requests that will be captured by the devtools.</p>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={testGet}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Test GET Request
        </button>
        
        <button 
          onClick={testPost}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Test POST Request
        </button>
        
        <button 
          onClick={testExternal}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Test External API
        </button>
      </div>
      
      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          <strong>Result:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}