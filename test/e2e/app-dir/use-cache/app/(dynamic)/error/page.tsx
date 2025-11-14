import React from 'react'

let attempts = 1
async function test() {
  'use cache'
  console.log('attempt %d', attempts++)

  throw new Error('bad')
}

export default async function Page() {
  await test()

  return <p>error page</p>
}
