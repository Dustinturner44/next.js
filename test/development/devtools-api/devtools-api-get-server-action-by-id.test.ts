import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import fs from 'fs/promises'

describe('devtools-api get server action by id', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'actions-app')),
  })

  it('should return action details', async () => {
    await next.render('/')

    const manifestPath = path.join(
      next.testDir,
      '.next',
      'server',
      'server-reference-manifest.json'
    )
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    const actionId = Object.keys(manifest.node || {})[0]
    expect(actionId).toBeTruthy()

    const response = await fetch(
      `${next.url}/_next/devtools-api/server-action?id=${encodeURIComponent(actionId)}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.id).toBe(actionId)
    expect(data.filename).toContain('app/actions.ts')
    expect(data.functionName).toBeTruthy()
  })

  it('should return error for missing id parameter', async () => {
    const response = await fetch(`${next.url}/_next/devtools-api/server-action`)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing id parameter')
  })

  it('should return error for non-existent action ID', async () => {
    const response = await fetch(
      `${next.url}/_next/devtools-api/server-action?id=${encodeURIComponent('non-existent-id-12345')}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  it('should return inline server action details', async () => {
    await next.render('/inline')

    const manifestPath = path.join(
      next.testDir,
      '.next',
      'server',
      'server-reference-manifest.json'
    )
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    const inlineActionId = Object.keys(manifest.node || {}).find((id) => {
      const action = manifest.node[id]
      return (
        action.filename === 'app/inline/page.tsx' &&
        action.exportedName?.startsWith('$$RSC_SERVER_ACTION_')
      )
    })
    expect(inlineActionId).toBeTruthy()

    const response = await fetch(
      `${next.url}/_next/devtools-api/server-action?id=${encodeURIComponent(inlineActionId)}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.id).toBe(inlineActionId)
    expect(data.filename).toBeTruthy()
  })
})
