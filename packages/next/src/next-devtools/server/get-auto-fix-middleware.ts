import type { ServerResponse, IncomingMessage } from 'http'
import { middlewareResponse } from './middleware-response'
import { promises as fs } from 'fs'
import path from 'path'

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

interface AutoFixRequest {
  prompt: string
}

interface AutoFixResponse {
  success: boolean
  fix?: string
  explanation?: string
  error?: string
  appliedChanges?: AppliedChange[]
}

interface AppliedChange {
  file: string
  changes: string
  line?: number
}

export function getAutoFixMiddleware(projectDir: string) {
  return async function (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const { pathname } = new URL(`http://n${req.url}`)

    if (pathname !== '/__nextjs_auto_fix') {
      return next()
    }

    if (req.method !== 'POST') {
      return middlewareResponse.methodNotAllowed(res)
    }

    try {
      // Parse request body
      const body = await parseRequestBody(req)
      const { prompt }: AutoFixRequest = JSON.parse(body)

      if (!prompt || typeof prompt !== 'string') {
        return middlewareResponse.badRequest(res)
      }

      // Call Claude via AI SDK to generate fix
      const result = await generateClaudeFix(prompt, req, projectDir)

      return middlewareResponse.json(res, result)
    } catch (error) {
      console.error('Auto fix error:', error)
      const result: AutoFixResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Auto fix failed',
      }
      return middlewareResponse.json(res, result)
    }
  }
}

async function parseRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      resolve(body)
    })
    req.on('error', reject)
  })
}

async function generateClaudeFix(
  prompt: string,
  req: IncomingMessage,
  projectDir: string
): Promise<AutoFixResponse> {
  try {
    // Enhanced prompt for Claude to provide actionable fixes
    const enhancedPrompt = `
You are a Next.js expert helping to fix development errors. The user has encountered the following error:

${prompt}

Please analyze the error and provide specific code changes that can be automatically applied. 

IMPORTANT: If the error includes file paths and line numbers, provide exact file modifications. Only suggest changes for files that clearly exist in the error context.

Format your response as JSON with the following structure:
{
  "explanation": "Brief explanation of what's causing the error",
  "fix": "General description of the fix",
  "fileChanges": [
    {
      "file": "relative/path/to/file.js",
      "action": "replace|add|delete",
      "lineNumber": 10,
      "oldCode": "exact code to replace (only for 'replace' action)",
      "newCode": "exact code to insert or replace with"
    }
  ]
}

Action types:
- "replace": Replace oldCode with newCode at the specified line
- "add": Insert newCode at the specified line (pushes existing lines down)
- "delete": Remove lines (not yet implemented)

CRITICAL CODE FORMATTING RULES:
- Always include proper quotes around JavaScript/TypeScript strings and directives
- Use single quotes for React directives: 'use client', 'use server'
- Include proper semicolons where required
- Maintain correct indentation and whitespace
- For import statements, include proper quotes: import { useState } from 'react'

Examples of proper formatting:
- Directive: 'use client'
- Import: import React from 'react'
- String: const message = 'Hello World'

Only include fileChanges if you can identify specific files and exact code changes from the error context. If no specific files can be identified, leave fileChanges as an empty array.

Be concise but thorough. Focus on actionable solutions.
`.trim()

    // Use AI SDK to process the prompt
    const claudeResponse = await callClaudeWithAISDK(enhancedPrompt)

    // Apply file changes if any were suggested
    let appliedChanges: AppliedChange[] = []
    if (claudeResponse.fileChanges && claudeResponse.fileChanges.length > 0) {
      appliedChanges = await applyFileChanges(
        claudeResponse.fileChanges,
        projectDir
      )
    }

    const result = {
      success: true,
      fix: claudeResponse.fix,
      explanation: claudeResponse.explanation,
      appliedChanges,
    }

    console.log(
      `🎉 Auto fix completed successfully! Applied ${appliedChanges.length} changes`
    )

    return result
  } catch (error) {
    console.error('❌ Auto fix failed:', error)
    throw new Error(
      `Claude AI error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

interface FileChange {
  file: string
  action: 'replace' | 'add' | 'delete'
  lineNumber?: number
  oldCode?: string // Required for 'replace', not used for 'add'
  newCode?: string // Required for both 'replace' and 'add'
}

async function callClaudeWithAISDK(
  prompt: string
): Promise<{ fix: string; explanation: string; fileChanges?: FileChange[] }> {
  try {
    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY not found. Using fallback response.')
      return getFallbackResponse()
    }

    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt,
      maxTokens: 1024,
    })

    const content = result.text
    if (!content) {
      throw new Error('No response from Claude')
    }

    // Try to parse as JSON first, fallback to plain text
    try {
      const parsedResponse = JSON.parse(content)
      return {
        fix: parsedResponse.fix || content,
        explanation: parsedResponse.explanation || 'Generated by Claude',
        fileChanges: parsedResponse.fileChanges || [],
      }
    } catch {
      // If not JSON, treat as plain text and extract useful parts
      return parseClaudeTextResponse(content)
    }
  } catch (error) {
    console.error('Claude AI SDK call failed:', error)
    return getFallbackResponse()
  }
}

async function applyFileChanges(
  fileChanges: FileChange[],
  projectDir: string
): Promise<AppliedChange[]> {
  const appliedChanges: AppliedChange[] = []

  // Use the passed project directory
  const projectRoot = projectDir

  console.log(
    `🔧 Applying ${fileChanges.length} file change(s) in project: ${projectRoot}`
  )

  // Group changes by file to handle multiple changes per file correctly
  const changesByFile = new Map<string, FileChange[]>()

  for (const change of fileChanges) {
    if (!changesByFile.has(change.file)) {
      changesByFile.set(change.file, [])
    }
    changesByFile.get(change.file)!.push(change)
  }

  // Process each file
  for (const [filePath, changes] of changesByFile) {
    try {
      console.log(`📁 Processing ${changes.length} change(s) for: ${filePath}`)
      const fullFilePath = path.resolve(projectRoot, filePath)

      // Security check: ensure we're not modifying files outside the project
      if (!fullFilePath.startsWith(projectRoot)) {
        console.warn(
          `⚠️  Skipping file changes outside project root: ${filePath}`
        )
        continue
      }

      // Check if file exists
      try {
        await fs.access(fullFilePath)
        console.log(`✓ File exists: ${fullFilePath}`)
      } catch {
        console.warn(`⚠️  File not found, skipping: ${filePath}`)
        continue
      }

      // Read file content
      const originalContent = await fs.readFile(fullFilePath, 'utf8')
      const lines = originalContent.split('\n')

      // Sort changes by line number in descending order (apply from bottom to top)
      // This prevents line number shifts from affecting subsequent changes
      const sortedChanges = changes
        .filter(
          (change) =>
            (change.action === 'replace' && change.oldCode && change.newCode) ||
            (change.action === 'add' && change.newCode)
        )
        .sort((a, b) => (b.lineNumber || 0) - (a.lineNumber || 0))

      let modifiedLines = [...lines]
      let fileWasModified = false

      for (const change of sortedChanges) {
        const success = await applyLineBasedChange(
          modifiedLines,
          change,
          filePath
        )
        if (success) {
          fileWasModified = true
          const changeDescription =
            change.action === 'add'
              ? `Added: ${change.newCode!.slice(0, 100)}...`
              : `Replaced: ${change.oldCode!.slice(0, 50)}... -> ${change.newCode!.slice(0, 50)}...`

          appliedChanges.push({
            file: filePath,
            changes: changeDescription,
            line: change.lineNumber,
          })

          // console.log(`✅ Applied change to ${filePath}:`)
          if (change.action === 'replace') {
            // console.log(`   Old: ${change.oldCode!.replace(/\n/g, '\\n')}`)
            // console.log(`   New: ${change.newCode!.replace(/\n/g, '\\n')}`)
          } else if (change.action === 'add') {
            // console.log(`   Added: ${change.newCode!.replace(/\n/g, '\\n')}`)
          }
          if (change.lineNumber) {
            // console.log(`   Line: ${change.lineNumber}`)
          }
        }
      }

      // Write the modified content back to file if any changes were applied
      if (fileWasModified) {
        const newContent = modifiedLines.join('\n')
        await fs.writeFile(fullFilePath, newContent, 'utf8')
        console.log(`💾 Saved changes to ${filePath}`)
      }
    } catch (error) {
      console.error(`❌ Failed to apply changes to ${filePath}:`, error)
    }
  }

  console.log(
    `📋 Summary: Successfully applied ${appliedChanges.length} of ${fileChanges.length} file changes`
  )
  if (appliedChanges.length > 0) {
    console.log(
      'Modified files:',
      [...new Set(appliedChanges.map((c) => c.file))].join(', ')
    )
  }

  return appliedChanges
}

async function applyLineBasedChange(
  lines: string[],
  change: FileChange,
  fileName: string
): Promise<boolean> {
  if (!change.lineNumber || !change.newCode) {
    // Fall back to content-based replacement if no line number or new code specified
    return applyContentBasedChange(lines, change, fileName)
  }

  const lineIndex = change.lineNumber - 1 // Convert to 0-based index

  if (change.action === 'add') {
    // Handle add action - insert new lines at the specified position
    if (lineIndex < 0 || lineIndex > lines.length) {
      console.warn(
        `⚠️  Insert position ${change.lineNumber} out of bounds in ${fileName} (file has ${lines.length} lines)`
      )
      return false
    }

    const newCodeLines = change.newCode.split('\n')

    // Insert the new lines at the specified position
    // lineIndex represents where to insert (everything at that position and below gets pushed down)
    lines.splice(lineIndex, 0, ...newCodeLines)

    console.log(
      `✓ Inserted ${newCodeLines.length} line(s) at position ${change.lineNumber} in ${fileName}`
    )
    return true
  }

  if (change.action === 'replace') {
    // Handle replace action
    if (!change.oldCode) {
      console.warn(`⚠️  Replace action requires oldCode in ${fileName}`)
      return false
    }

    if (lineIndex < 0 || lineIndex >= lines.length) {
      console.warn(
        `⚠️  Line ${change.lineNumber} out of bounds in ${fileName} (file has ${lines.length} lines)`
      )
      return applyContentBasedChange(lines, change, fileName)
    }

    // For single-line changes, check if the old code matches the line
    const oldCodeLines = change.oldCode.split('\n')
    const newCodeLines = change.newCode.split('\n')

    if (oldCodeLines.length === 1) {
      // Single line replacement
      const currentLine = lines[lineIndex]
      if (currentLine.includes(change.oldCode)) {
        lines[lineIndex] = currentLine.replace(change.oldCode, change.newCode)
        return true
      } else {
        console.warn(
          `⚠️  Expected code not found at line ${change.lineNumber} in ${fileName}`
        )
        console.warn(`   Expected: ${change.oldCode}`)
        console.warn(`   Found: ${currentLine}`)
        return false
      }
    } else {
      // Multi-line replacement
      if (lineIndex + oldCodeLines.length > lines.length) {
        console.warn(
          `⚠️  Multi-line change extends beyond file end in ${fileName}`
        )
        return false
      }

      // Check if the old code matches the lines starting from lineIndex
      let matches = true
      for (let i = 0; i < oldCodeLines.length; i++) {
        if (lines[lineIndex + i] !== oldCodeLines[i]) {
          matches = false
          break
        }
      }

      if (matches) {
        // Replace the lines
        lines.splice(lineIndex, oldCodeLines.length, ...newCodeLines)
        return true
      } else {
        console.warn(
          `⚠️  Multi-line old code doesn't match at line ${change.lineNumber} in ${fileName}`
        )
        return false
      }
    }
  }

  console.warn(`⚠️  Unknown action '${change.action}' in ${fileName}`)
  return false
}

async function applyContentBasedChange(
  lines: string[],
  change: FileChange,
  fileName: string
): Promise<boolean> {
  if (!change.oldCode || !change.newCode) {
    return false
  }

  const content = lines.join('\n')
  const newContent = content.replace(change.oldCode, change.newCode)

  if (newContent !== content) {
    const newLines = newContent.split('\n')
    lines.length = 0
    lines.push(...newLines)
    console.log(`✓ Applied content-based replacement in ${fileName}`)
    return true
  } else {
    console.warn(
      `⚠️  Content-based replacement failed in ${fileName} - old code not found`
    )
    return false
  }
}

function parseClaudeTextResponse(content: string): {
  fix: string
  explanation: string
} {
  // Simple parsing to extract explanation and fix from text response
  const lines = content.split('\n').filter((line) => line.trim())

  let explanation = ''
  let fix = ''
  let currentSection = 'explanation'

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (
      lowerLine.includes('fix') ||
      lowerLine.includes('solution') ||
      lowerLine.includes('steps')
    ) {
      currentSection = 'fix'
      continue
    }

    if (currentSection === 'explanation' && !explanation) {
      explanation = line.trim()
    } else if (currentSection === 'fix') {
      fix += (fix ? '\n' : '') + line.trim()
    }
  }

  return {
    explanation: explanation || 'Claude analysis provided',
    fix: fix || content,
  }
}

function getFallbackResponse(): { fix: string; explanation: string } {
  return {
    explanation:
      'Auto-fix service requires ANTHROPIC_API_KEY environment variable to be set. Install AI SDK dependencies: npm install ai @ai-sdk/anthropic',
    fix: '1. Check the error message and stack trace carefully\n2. Verify your code syntax and imports\n3. Check Next.js documentation for similar issues\n4. Restart your development server\n5. Clear Next.js cache with `rm -rf .next`\n\nTo enable AI-powered auto-fix:\n1. Set ANTHROPIC_API_KEY environment variable\n2. Install dependencies: npm install ai @ai-sdk/anthropic',
  }
}
