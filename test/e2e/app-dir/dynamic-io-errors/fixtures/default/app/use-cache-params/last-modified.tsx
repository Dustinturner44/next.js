export async function LastModified({ params }) {
  await Promise.resolve()
  console.trace('LastModified')
  const { slug } = await params
  // const { slug } = await params.then((p) => ({ slug: p.slug }))

  return (
    <p>
      Page /{slug} last modified: {new Date().toISOString()}
    </p>
  )
}

export async function CachedLastModified({ params }) {
  'use cache'

  return <LastModified params={params} />
}
