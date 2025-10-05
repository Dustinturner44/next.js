import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'

describe('devtools-api get project path', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'default-template')),
  })

  it('should return correct project path', async () => {
    const response = await fetch(`${next.url}/_next/devtools-api/project-path`)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.projectPath).toBeDefined()
    expect(path.isAbsolute(data.projectPath)).toBe(true)
    expect(data.projectPath).toBe(next.testDir)
  })
})
