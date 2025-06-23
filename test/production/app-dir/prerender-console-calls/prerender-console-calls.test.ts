import { nextTestSetup } from 'e2e-utils'
import stripAnsi from 'strip-ansi'

describe('prerender-console-calls', () => {
  const { next } = nextTestSetup({
    files: __dirname,
    skipStart: true,
  })

  // Recommended for tests that check HTML. Cheerio is a HTML parser that has a jQuery like API.
  it('should prefix console calls', async () => {
    const { cliOutput: coloredCliOutput, exitCode } = await next.build()

    expect(exitCode).toEqual(1)

    const cliOutput = stripAnsi(coloredCliOutput)
    const lines = cliOutput.split('\n')

    const passOneLogs = lines.filter((line) => line.includes('PassOnePage: '))
    expect(passOneLogs).toEqual([
      // Node.js might drain stdout/err out-of-order. We only care about the prefix here.
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      // experimental.dynamicIO does two render passes.
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
      expect.stringMatching(/^\[Route "\/pass\/one"\]/),
    ])
    const failOneLogs = lines.filter((line) => line.includes('FailOnePage: '))
    expect(failOneLogs).toEqual([
      // Node.js might drain stdout/err out-of-order. We only care about the prefix here.
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      // experimental.dynamicIO does two render passes.
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
      expect.stringMatching(/^\[Route "\/fail\/one"\]/),
    ])

    expect(cliOutput).toContain(
      '\n[Route "/fail/one"] Error: A component accessed data'
    )
    expect(cliOutput).toContain(
      '\n[Route "/fail/one"] Error occurred prerendering page. Read more: https://nextjs.org/docs/messages/prerender-error\n'
    )
  })
})
