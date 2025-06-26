import { nextTestSetup } from 'e2e-utils'

describe('Lazy Not Found', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('todo', async () => {
    // const browser =
    await next.browser('/')
    await new Promise((resolve) => setTimeout(resolve, 60000))
  })
})
