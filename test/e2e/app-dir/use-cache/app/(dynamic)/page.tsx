import { Foo } from '../client'

async function getCachedRandom(x: number, children: React.ReactNode) {
  'use cache'
  return {
    x,
    y: Math.random(),
    z: <Foo />,
    r: children,
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>
}) {
  const n = parseInt((await searchParams).n ?? '0')
  const values = await getCachedRandom(
    n,
    <p id="r">rnd{Math.random()}</p> // This should not invalidate the cache
  )
  return (
    <>
      <p id="x">{values.x}</p>
      <p id="y">{values.y}</p>
      <p id="z">{values.z}</p>
      {values.r}
    </>
  )
}
