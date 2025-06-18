import 'server-only'

async function expensiveCalculation(input: string) {
  'use cache'

  // Simulate expensive computation
  let result = 0
  for (let i = 0; i < 1000000; i++) {
    result += input.length * i
  }

  return {
    result,
    input,
    timestamp: Date.now(),
  }
}

export default async function UseCacheFunctionPage() {
  const result = await expensiveCalculation('test-input')

  return (
    <div>
      <h1>Use Cache Function Test</h1>
      <div>Expensive calculation result: {result.result}</div>
      <div>Input: {result.input}</div>
      <div>Calculated at: {new Date(result.timestamp).toISOString()}</div>
    </div>
  )
}
