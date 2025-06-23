import { setTimeout } from 'timers/promises'

export default async function PassOnePage() {
  console.log('PassOnePage: log immediately')
  console.error('PassOnePage: error immediately')

  await setTimeout(0)

  console.log('PassOnePage: log after macrotask')
  console.error('PassOnePage: error after macrotask')

  return null
}
