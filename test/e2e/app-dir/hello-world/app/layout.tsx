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
