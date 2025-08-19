import { connection } from 'next/server'
import { Suspense } from 'react'

interface LessonPageProps {
  params: Promise<{
    lessonSlug: string
  }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonSlug } = await params
  return (
    <div>
      <h1>Lesson Page {lessonSlug}</h1>
      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <DynamicHole />
        </Suspense>
      </div>
    </div>
  )
}

const DynamicHole = async () => {
  await connection()
  return (
    <div>
      <h1>Dynamic Hole</h1>
    </div>
  )
}
