export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <header>Layout</header>
        {children}
      </body>
    </html>
  )
}
