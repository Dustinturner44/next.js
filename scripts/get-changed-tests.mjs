// @ts-check
import fs from 'fs/promises'
import execa from 'execa'
import path from 'path'
import { getDiffRevision, getGitInfo } from './git-info.mjs'

/**
 * Detects changed tests files by comparing the current branch with `origin/canary`
 * Returns tests separated by test mode (dev/prod), as well as the corresponding commit hash
 * that the current branch is pointing to
 */
export default async function getChangedTests() {
  /** @type import('execa').Options */
  const EXECA_OPTS = { shell: true }

  const { branchName, remoteUrl, commitSha, isCanary } = await getGitInfo()

  if (isCanary) {
    console.log(`Skipping flake detection for canary`)
    return { devTests: [], prodTests: [] }
  }

  const diffRevision = await getDiffRevision()

  const changesResult = await execa(
    `git diff ${diffRevision} --name-only`,
    EXECA_OPTS
  ).catch((err) => {
    console.error(err)
    return { stdout: '', stderr: '' }
  })
  console.log(
    {
      branchName,
      remoteUrl,
      isCanary,
      commitSha,
    },
    `\ngit diff:\n${changesResult.stderr}\n${changesResult.stdout}`
  )
  const changedFiles = changesResult.stdout.split('\n')

  // run each test 3 times in each test mode (if E2E) with no-retrying
  // and if any fail it's flakey
  const devTests = new Set()
  const prodTests = new Set()

  // Helper function to add test file to appropriate lists
  const addTestFile = (testFile) => {
    if (
      testFile.startsWith('test/e2e/') ||
      testFile.startsWith('test/integration/')
    ) {
      devTests.add(testFile)
      prodTests.add(testFile)
    } else if (testFile.startsWith('test/prod')) {
      prodTests.add(testFile)
    } else if (testFile.startsWith('test/development')) {
      devTests.add(testFile)
    }
  }

  // Helper function to find test files in directory
  const findTestFilesInDir = async (dir) => {
    try {
      const entries = await fs.readdir(path.join(process.cwd(), dir), {
        withFileTypes: true,
      })
      const testFiles = []
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name).replace(/\\/g, '/')
        if (entry.isFile() && entry.name.match(/\.test\.(js|ts|tsx)$/)) {
          testFiles.push(fullPath)
        }
      }
      return testFiles
    } catch (err) {
      return []
    }
  }

  for (let file of changedFiles) {
    // normalize slashes
    file = file.replace(/\\/g, '/')
    const fileExists = await fs
      .access(path.join(process.cwd(), file), fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)

    if (fileExists && file.match(/^test\/.*?\.test\.(js|ts|tsx)$/)) {
      // Direct test file change
      addTestFile(file)
    } else if (
      fileExists &&
      file.match(/^test\/(e2e|development|integration|production)\//)
    ) {
      // Changed file in specific test directories
      // Search upward from the changed file to find the directory containing test files
      const parts = file.split('/')
      const testCategory = parts[1] // e2e, development, integration, or production
      const testCategoryPrefix = `test/${testCategory}`

      // Helper to recursively find all test files in a directory
      const findTestFilesRecursive = async (dir) => {
        const testFiles = []
        try {
          const entries = await fs.readdir(path.join(process.cwd(), dir), {
            withFileTypes: true,
          })

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name).replace(/\\/g, '/')
            if (entry.isDirectory()) {
              // Recursively search subdirectories
              const subTests = await findTestFilesRecursive(fullPath)
              testFiles.push(...subTests)
            } else if (entry.name.match(/\.test\.(js|ts|tsx)$/)) {
              testFiles.push(fullPath)
            }
          }
        } catch (err) {
          // Directory doesn't exist or can't be read
        }
        return testFiles
      }

      // Search upward from the changed file's directory to find where test files are
      // Start from the parent directory of the changed file, working upward
      // Stop when we find a directory containing test files
      let testRootDir = null
      for (let i = parts.length - 1; i >= 2; i--) {
        const currentDir = parts.slice(0, i).join('/')
        const testFiles = await findTestFilesInDir(currentDir)

        if (testFiles.length > 0) {
          testRootDir = currentDir
          break
        }
      }

      // If we found a directory with test files, search it recursively
      // Otherwise fall back to the test category directory
      if (!testRootDir) {
        testRootDir = testCategoryPrefix
      }

      const testFiles = await findTestFilesRecursive(testRootDir)
      testFiles.forEach(addTestFile)
    }
  }

  console.log(
    'Detected tests:',
    JSON.stringify(
      {
        devTests: Array.from(devTests),
        prodTests: Array.from(prodTests),
      },
      null,
      2
    )
  )

  return {
    devTests: Array.from(devTests),
    prodTests: Array.from(prodTests),
    commitSha,
  }
}
