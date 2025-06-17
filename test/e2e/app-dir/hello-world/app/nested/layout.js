export default function NestedPage({ children }) {
  return (
    <div>
      <h1>Nested Layout</h1>
      <p>This is a nested layout in the app directory.</p>
      {children}
    </div>
  )
}
