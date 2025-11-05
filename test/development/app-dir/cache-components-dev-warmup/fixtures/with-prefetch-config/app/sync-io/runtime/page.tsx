import { Suspense } from 'react'
import { CachedData, getCachedData } from '../../data-fetching'
import { cookies } from 'next/headers'
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external'

export const unstable_prefetch = { mode: 'runtime', samples: [{}] }

const CACHE_KEY = __dirname + '/__PAGE__'

export default async function Page() {
  return (
    <main>
      <h1>Sync IO - runtime stage</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Runtime />
      </Suspense>
    </main>
  )
}

async function Runtime() {
  await getCachedData(CACHE_KEY + '-1')
  console.log(`after first cache`)

  await cookies()
  console.log(`after cookies`)

  console.log(
    `before sync io - ${Date.__IS_PATCHED ? 'Date is patched' : 'Date is NOT PATCHED!!!!!!!'}, stage: ${workUnitAsyncStorage.getStore()?.['stagedRendering']?.['currentStage']}`
  )
  new Date()
  console.log(`after sync io`)

  return <CachedData label="page" cacheKey={CACHE_KEY} />
}
