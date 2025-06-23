import { setTimeout } from 'timers/promises'

export default async function FailOnePage() {
  console.log('FailOnePage: log immediately')
  console.error('FailOnePage: error immediately')

  await setTimeout(0)

  console.log('FailOnePage: log after macrotask')
  console.error('FailOnePage: error after macrotask')

  return null
}
