import { nextTestSetup } from 'e2e-utils'

describe('circular-reference-client-component', () => {
  const { next } = nextTestSetup({
    files: __dirname,
    env: {
      NEXT_DEBUG_BUILD: '1',
    },
  })

  it('should not have errors when collecting segment data for a page with a circular reference to a client component', async () => {
    expect(next.cliOutput).not.toContain(
      'Error: Route / errored during segment collection'
    )
  })
})
