import { unstable_cacheLife } from 'next/cache'

// TODO: I think this is an incorrect type (it's an object, not a string)
// but since we're deprecating this API, we'll leave it as is for now
type CacheLife = Parameters<typeof unstable_cacheLife>[0]

async function getCachedValue(cacheLife: CacheLife) {
  'use cache'

  unstable_cacheLife(cacheLife)

  return Math.random()
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <p>hello world {await getCachedValue(slug as CacheLife)}</p>
}

export function generateStaticParams() {
  return [{ slug: 'days' }, { slug: 'weeks' }]
}
