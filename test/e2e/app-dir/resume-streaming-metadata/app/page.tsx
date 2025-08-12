export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id: string | undefined }>
}) {
  const { id } = await searchParams
  const random = Math.random()
  return (
    <p>
      hello world {random} {id}
    </p>
  )
}

export const generateMetadata = async () => {
  return {
    title: 'Hello World',
  }
}
