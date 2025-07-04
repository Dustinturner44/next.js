export default async function HeaderPage({ params }) {
  const { segment } = await params
  return (
    <div id="header-page">
      <h1>Parallel-Header: {segment}</h1>
    </div>
  )
}
