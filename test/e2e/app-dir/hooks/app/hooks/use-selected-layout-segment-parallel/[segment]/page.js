export default async function ChildrenPage({ params }) {
  const { segment } = await params
  return (
    <div id="children-page">
      <h1>Page-Children: {segment}</h1>
    </div>
  )
}
