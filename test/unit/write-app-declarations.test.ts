/* eslint-env jest */
import os from 'os'
import fs from 'fs-extra'
import { join } from 'path'
import { writeAppTypeDeclarations } from 'next/dist/lib/typescript/writeAppTypeDeclarations'

const fixtureDir = join(__dirname, 'fixtures/app-declarations')
const declarationFile = join(fixtureDir, 'next-env.d.ts')

describe('writeAppTypeDeclarations', () => {
  beforeEach(async () => {
    await fs.ensureDir(fixtureDir)
  })
  afterEach(() => fs.remove(declarationFile))

  it('should preserve CRLF EOL', async () => {
    const eol = '\r\n'
    const content =
      '// NOTE: This file should not be edited' +
      eol +
      '// see https://nextjs.org/docs/pages/api-reference/config/typescript for more information.' +
      eol

    await fs.writeFile(declarationFile, content)

    await writeAppTypeDeclarations({
      baseDir: fixtureDir,
      hasAppDir: false,
    })
    expect(await fs.readFile(declarationFile, 'utf8')).toBe(content)
  })

  it('should preserve LF EOL', async () => {
    const eol = '\n'
    const content =
      '// NOTE: This file should not be edited' +
      eol +
      '// see https://nextjs.org/docs/pages/api-reference/config/typescript for more information.' +
      eol

    await fs.writeFile(declarationFile, content)

    await writeAppTypeDeclarations({
      baseDir: fixtureDir,
      hasAppDir: false,
    })
    expect(await fs.readFile(declarationFile, 'utf8')).toBe(content)
  })

  it('should use OS EOL by default', async () => {
    const eol = os.EOL
    const content =
      '// NOTE: This file should not be edited' +
      eol +
      '// see https://nextjs.org/docs/pages/api-reference/config/typescript for more information.' +
      eol

    await writeAppTypeDeclarations({
      baseDir: fixtureDir,
      hasAppDir: false,
    })
    expect(await fs.readFile(declarationFile, 'utf8')).toBe(content)
  })

  it('should use app docs URL when hasAppDir is true', async () => {
    await writeAppTypeDeclarations({
      baseDir: fixtureDir,
      hasAppDir: true,
    })

    const content = await fs.readFile(declarationFile, 'utf8')
    expect(content).toContain(
      '// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.'
    )
  })

  it('should use pages docs URL when hasAppDir is false', async () => {
    await writeAppTypeDeclarations({
      baseDir: fixtureDir,
      hasAppDir: false,
    })

    const content = await fs.readFile(declarationFile, 'utf8')
    expect(content).toContain(
      '// see https://nextjs.org/docs/pages/api-reference/config/typescript for more information.'
    )
  })
})
