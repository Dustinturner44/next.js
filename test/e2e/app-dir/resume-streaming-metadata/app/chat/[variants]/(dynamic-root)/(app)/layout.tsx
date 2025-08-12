import { Suspense } from 'react'

export default async function Layout({
  children,
  content,
}: {
  children: React.ReactNode
  content: React.ReactNode
  params: Promise<{ variants: string }>
}) {
  return (
    <>
      {children}
      <Suspense>{content}</Suspense>
    </>
  )
}
