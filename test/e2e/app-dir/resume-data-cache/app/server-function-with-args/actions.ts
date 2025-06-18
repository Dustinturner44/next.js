'use server'

export async function processInput(input: string) {
  // This will use encrypted bound args
  return {
    processed: input.toUpperCase(),
    timestamp: Date.now(),
  }
}
