/**
 * Next.js Auto-Fix Middleware
 *
 * Supports dual AI providers:
 * - Anthropic Claude (default): Set ANTHROPIC_API_KEY
 * - Vercel AI (v0 mode): Set v0=1 and VERCEL_API_TOKEN
 *
 * Provider selection is based on process.env.v0:
 * - If v0 is set (any truthy value), uses Vercel AI with llama-3.1-70b-instruct
 * - Otherwise, uses Anthropic Claude with claude-3-5-sonnet-20241022
 */
import type { ServerResponse, IncomingMessage } from 'http'
import { middlewareResponse } from './middleware-response'
import fs, { promises as fsp } from 'fs'
import path from 'path'

import { generateText } from 'ai'
import { createVercel } from '@ai-sdk/vercel'
import { createAnthropic } from '@ai-sdk/anthropic'

const provider = process.env.v0
  ? createVercel({
      apiKey: process.env.VERCEL_API_TOKEN,
    })
  : createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

function getAIProvider() {
  if (process.env.v0) {
    console.log('🤖 Using Vercel AI (v0 mode enabled)')
    return {
      provider,
      model: 'llama-3.1-70b-instruct',
      apiKey: process.env.VERCEL_API_TOKEN,
      apiKeyName: 'VERCEL_API_TOKEN',
    }
  } else {
    console.log('🤖 Using Anthropic Claude')
    return {
      provider,
      model: 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
      apiKeyName: 'ANTHROPIC_API_KEY',
    }
  }
}

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

      // Call AI model via AI SDK to generate fix
      const result = await generateVibeFix(prompt, req, projectDir)

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

async function generateVibeFix(
  prompt: string,
  req: IncomingMessage,
  projectDir: string
): Promise<AutoFixResponse> {
  try {
    const aiConfig = getAIProvider()

    console.log('🔨 Auto Fix Request Received:')
    console.log(
      '📝 Error/Prompt:',
      prompt.slice(0, 200) + (prompt.length > 200 ? '...' : '')
    )
    console.log('📁 Project Directory:', projectDir)
    console.log(
      `🤖 AI Provider: ${process.env.v0 ? 'Vercel' : 'Anthropic'} (${aiConfig.model})`
    )
    console.log(
      `🔑 API Key Status: ${aiConfig.apiKey ? '✅ Available' : '❌ Missing'}`
    )

    // Extract and read file contents from the error/prompt
    const fileContents = await extractAndReadFileContents(prompt, projectDir)
    
    // Build file context section for the prompt
    let fileContextSection = ''
    if (fileContents.length > 0) {
      console.log(`📂 Found ${fileContents.length} file(s) in error context:`)
      fileContents.forEach((file) => {
        console.log(`   📄 ${file.path} (${file.content.split('\n').length} lines)`)
      })

      fileContextSection = `

CURRENT FILE CONTENTS:
${fileContents.map(file => `
=== ${file.path} ===
\`\`\`${getFileExtension(file.path)}
${file.content}
\`\`\`
`).join('\n')}

IMPORTANT: The above files show the CURRENT state. Use this context to:
1. Understand existing directives ('use client', 'use server') and their positions
2. See what imports already exist to avoid duplicates
3. Understand the current code structure and patterns
4. Generate fixes that work with the existing code state
5. Place new imports correctly based on existing directive placement
`
    } else {
      console.log('📂 No file contents extracted from error context')
    }

    // Enhanced prompt using v0's Next.js expertise
    const enhancedPrompt = `
You are v0, an advanced Next.js expert AI assistant with deep knowledge of React, TypeScript, and modern web development patterns. Fix the following development error:

${prompt}
${fileContextSection}
CRITICAL INSTRUCTIONS:
- Fix the ROOT CAUSE of the error, never just add try-catch blocks
- Apply v0's best practices for Next.js development
- Provide production-ready, optimized code solutions
- Use modern React patterns and TypeScript when applicable
- ANALYZE the current file contents above to understand the existing state

DIRECTIVE PLACEMENT RULES (CRITICAL):
- React directives ("use client", "use server", "use strict") MUST be at the very top of the file
- NEVER insert imports, comments, or any code before directives
- When adding imports to files with directives:
  * Keep directives at line 1
  * Insert imports starting at line 2 (after directives)
  * Maintain blank line between directives and imports if it exists
- If no directives exist, imports go at line 1 as normal
- CHECK the current file contents to see if directives already exist!

RESPONSE FORMAT (JSON only - MUST include fileChanges):
{
  "explanation": "Concise explanation of the root cause",
  "fix": "Summary of the solution applied", 
  "fileChanges": [
    {
      "file": "relative/path/to/file.tsx",
      "action": "replace",
      "lineNumber": 10,
      "oldCode": "exact problematic code to replace",
      "newCode": "fixed code with v0 best practices"
    },
    {
      "file": "relative/path/to/file.tsx", 
      "action": "add",
      "lineNumber": 2,
      "newCode": "import statement (use line 2 if 'use client' at line 1, otherwise line 1)"
    }
  ]
}

CRITICAL LINE NUMBER RULES:
- If file starts with 'use client' or other directive: add imports at line 2
- If no directive: add imports at line 1
- Always check the current file contents above to see existing directives
- NEVER duplicate existing imports - check what's already there

CRITICAL: Always provide specific fileChanges array with actionable fixes. Do not leave fileChanges empty unless no code changes are needed.

V0'S NEXT.JS EXPERTISE:

🔧 Import Patterns:
- Next.js Image: import Image from 'next/image' (default export)
- Next.js Link: import Link from 'next/link' (default export)
- App Router: import { useRouter } from 'next/navigation'
- Pages Router: import { useRouter } from 'next/router'
- React hooks: import { useState, useEffect, useCallback } from 'react'

🎯 Hydration Solutions:
- Client-only code: useEffect(() => { /* browser APIs */ }, [])
- Dynamic imports: const Component = dynamic(() => import('./Component'), { ssr: false })
- Safe checks: typeof window !== 'undefined' && window.api()
- Consistent SSR/client rendering patterns

⚛️ React Best Practices:
- All hooks at component top level (before any conditions/loops)
- Use useCallback for event handlers with dependencies
- Proper dependency arrays in useEffect
- State updates via setters, never hooks in event handlers

🖼️ Image Optimization:
- Always include width/height OR use fill={true}
- Meaningful alt text for accessibility
- priority={true} for above-the-fold images
- sizes prop for responsive images
- Configure domains in next.config.js for external images

🔒 Type Safety:
- Optional chaining: data?.field?.value
- Nullish coalescing: value ?? defaultValue
- Proper TypeScript interfaces for props
- Runtime type guards when needed

🎨 Modern Patterns:
- Server components by default (no 'use client' unless needed)
- 'use client' only for interactivity/hooks/browser APIs
- Proper error boundaries for production apps
- Suspense boundaries for loading states

EXAMPLES FROM V0:

❌ Bad: import { Image } from 'next/image'
✅ v0: import Image from 'next/image'

❌ Bad: data.user.profile.name
✅ v0: data?.user?.profile?.name ?? 'Unknown'

❌ Bad: if (show) { const [count] = useState(0) }
✅ v0: const [count, setCount] = useState(0); const [show, setShow] = useState(false)

❌ Bad: <div>{Math.random()}</div>
✅ v0: const [random, setRandom] = useState(0); useEffect(() => setRandom(Math.random()), [])

❌ Bad: <Image src="/pic.jpg" />
✅ v0: <Image src="/pic.jpg" alt="Description" width={500} height={300} priority />

🚨 DIRECTIVE PLACEMENT EXAMPLES:

❌ WRONG: Adding import before directive
import React from 'react'
'use client'

✅ CORRECT: Keep directive at top, add imports after
'use client'
import React from 'react'

❌ WRONG: Moving directive down
'use client'
import React from 'react'
import { useState } from 'react'  // Don't insert here

✅ CORRECT: Add all imports after directive
'use client'
import React from 'react'
import { useState } from 'react'

Apply v0's expertise to provide the most elegant, performant, and maintainable solution.
`.trim()

    // Use AI SDK to process the prompt
    const aiResponse = await callAIWithSDK(enhancedPrompt, projectDir)

    console.log('🤖 AI Response Received:')
    console.log('💡 Explanation:', aiResponse.explanation)
    console.log('🔧 File Changes:', aiResponse.fileChanges)
    // console.log('📄 File Changes Suggested:', aiResponse.fileChanges?.length || 0)

    if (aiResponse.fileChanges && aiResponse.fileChanges.length > 0) {
      console.log('📋 Suggested Changes:')
      aiResponse.fileChanges.forEach((change, index) => {
        console.log(
          `  ${index + 1}. ${change.action.toUpperCase()} in ${change.file}:${change.lineNumber}`
        )
        if (change.oldCode) {
          console.log(
            `     Old: ${change.oldCode.slice(0, 50)}${change.oldCode.length > 50 ? '...' : ''}`
          )
        }
        if (change.newCode) {
          console.log(
            `     New: ${change.newCode.slice(0, 50)}${change.newCode.length > 50 ? '...' : ''}`
          )
        }
      })
    }

    // Apply file changes if any were suggested
    let appliedChanges: AppliedChange[] = []
    if (aiResponse.fileChanges && aiResponse.fileChanges.length > 0) {
      console.log('🚀 Applying file changes...')
      appliedChanges = await applyFileChanges(
        aiResponse.fileChanges,
        projectDir
      )
    }

    const result = {
      success: true,
      fix: aiResponse.fix,
      explanation: aiResponse.explanation,
      appliedChanges,
    }

    console.log('✅ Auto Fix Completed Successfully!')
    console.log(`📊 Summary: Applied ${appliedChanges.length} changes`)

    if (appliedChanges.length > 0) {
      console.log('📝 Files Modified:')
      appliedChanges.forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.file}`)
        console.log(`     Changes: ${change.changes}`)
        if (change.line) {
          console.log(`     Line: ${change.line}`)
        }
      })
    } else {
      console.log('ℹ️ No file changes were applied')
    }

    return result
  } catch (error) {
    console.error('❌ Auto Fix Failed:')
    console.error(
      '   Error:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    console.error(
      '   Stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    )
    throw new Error(
      `AI Auto Fix error: ${error instanceof Error ? error.message : 'Unknown error'}`
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

async function callAIWithSDK(
  prompt: string,
  projectDir: string
): Promise<{ fix: string; explanation: string; fileChanges?: FileChange[] }> {
  try {
    // Get the appropriate AI provider based on environment
    const aiConfig = getAIProvider()

    // Check for API key
    if (!aiConfig.apiKey) {
      console.warn(`${aiConfig.apiKeyName} not found. Using fallback response.`)
      return getFallbackResponse()
    }

    const result = await generateText({
      model: aiConfig.provider(aiConfig.model),
      prompt,
      maxTokens: 1024,
    })

    const content = result.text
    if (!content) {
      throw new Error('No response from AI')
    }

    console.log('🔍 Raw AI Response:')
    console.log(content.slice(0, 500) + (content.length > 500 ? '...' : ''))

    // Try to parse as JSON first, fallback to plain text
    try {
      const parsedResponse = JSON.parse(content)

      console.log('✅ Successfully parsed JSON response')
      console.log('📊 Response structure:', {
        hasExplanation: !!parsedResponse.explanation,
        hasFix: !!parsedResponse.fix,
        hasFileChanges: !!parsedResponse.fileChanges,
        fileChangesCount: parsedResponse.fileChanges?.length || 0,
      })

      // Validate that we have fileChanges if fix is provided
      if (
        parsedResponse.fix &&
        (!parsedResponse.fileChanges || parsedResponse.fileChanges.length === 0)
      ) {
        console.log(
          '⚠️ AI provided fix but no fileChanges - attempting to extract from fix text'
        )
        const extractedChanges = extractFileChangesFromText(
          parsedResponse.fix,
          content
        )
        parsedResponse.fileChanges = extractedChanges

        if (extractedChanges.length === 0) {
          console.log(
            '❌ Could not extract any actionable file changes from AI response'
          )
          console.log(
            '   This may indicate the AI needs better prompting or the error is not code-related'
          )
        }
      }

      // Fix invalid file paths in AI response
      if (parsedResponse.fileChanges) {
        const correctedFileChanges = parsedResponse.fileChanges.map(
          (change: FileChange) => {
            if (!isValidFilePath(change.file, projectDir)) {
              console.log(`🔧 Correcting invalid file path: "${change.file}"`)
              const actualFilePath = extractFilePathFromPrompt(
                prompt,
                projectDir
              )
              if (actualFilePath) {
                console.log(
                  `   Using file path from error context: ${actualFilePath}`
                )
                return { ...change, file: actualFilePath }
              } else {
                console.warn(
                  `   Could not determine actual file path, using fallback`
                )
                return { ...change, file: 'src/page.tsx' } // Reasonable fallback
              }
            }
            return change
          }
        )
        parsedResponse.fileChanges = correctedFileChanges
      }

      const result = {
        fix: parsedResponse.fix || content,
        explanation: parsedResponse.explanation || 'Generated by AI',
        fileChanges: parsedResponse.fileChanges || [],
      }

      console.log(
        `📋 Final result: ${result.fileChanges.length} file changes to apply`
      )
      return result
    } catch (parseError) {
      console.log('⚠️ Failed to parse JSON, processing as text response')
      console.log(
        'Parse error:',
        parseError instanceof Error ? parseError.message : 'Unknown'
      )
      // If not JSON, treat as plain text and extract useful parts
      return parseTextResponse(content)
    }
  } catch (error) {
    console.error('AI SDK call failed:', error)
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
      console.log(`   Full path: ${path.resolve(projectRoot, filePath)}`)

      changes.forEach((change, index) => {
        console.log(
          `   Change ${index + 1}: ${change.action} at line ${change.lineNumber}`
        )
        if (change.oldCode) {
          console.log(
            `     Replacing: "${change.oldCode.replace(/\n/g, '\\n')}"`
          )
        }
        if (change.newCode) {
          console.log(`     With: "${change.newCode.replace(/\n/g, '\\n')}"`)
        }
      })

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
        await fsp.access(fullFilePath)
        console.log(`✓ File exists: ${fullFilePath}`)
      } catch {
        console.warn(`⚠️  File not found, skipping: ${filePath}`)
        continue
      }

      // Read file content
      const originalContent = await fsp.readFile(fullFilePath, 'utf8')
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
        await fsp.writeFile(fullFilePath, newContent, 'utf8')
        console.log(
          `💾 Successfully saved ${sortedChanges.length} change(s) to: ${filePath}`
        )
        console.log(
          `   File size: ${originalContent.length} → ${newContent.length} characters`
        )
        console.log(`   Lines: ${lines.length} → ${modifiedLines.length}`)
      } else {
        console.log(
          `⚠️ No changes applied to ${filePath} (no modifications made)`
        )
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

function extractFileChangesFromText(
  fixText: string,
  fullContent: string
): FileChange[] {
  const fileChanges: FileChange[] = []

  // Look for common patterns in fix text that might indicate file changes
  const patterns = [
    // Look for file paths
    /(?:in|file|update|change|modify)\s+([^\s]+\.(?:tsx?|jsx?|js|ts))/gi,
    // Look for import statements
    /import\s+.*?from\s+['"][^'"]+['"]/gi,
    // Look for line references
    /line\s+(\d+)/gi,
  ]

  // Try to extract file paths from the content
  // More robust regex that looks for actual file paths, not just any text ending with file extensions
  const filePathMatches =
    fullContent.match(
      /(?:(?:\.?\/)?[\w-]+\/)*[\w-]+\.(?:tsx?|jsx?|js|ts)(?!\w)/g
    ) || []
  // Filter out common false positives like "Next.js"
  const filteredMatches = filePathMatches.filter(
    (match) =>
      (!match.toLowerCase().includes('next.js') &&
        !match.toLowerCase().includes('react.js') &&
        match.includes('/')) ||
      match.length > 8 // Either has path separators or is long enough to be a real filename
  )
  const uniqueFiles = [...new Set(filteredMatches)]

  // If we found potential files and the fix contains actionable text, create basic file changes
  if (uniqueFiles.length > 0 && fixText.length > 50) {
    const firstFile = uniqueFiles[0]

    // Look for import-related fixes
    if (fixText.toLowerCase().includes('import') && fixText.includes('from')) {
      const importMatch = fixText.match(/import\s+.*?from\s+['"][^'"]+['"]/i)
      if (importMatch) {
        // Smart line number detection for directives
        // Default to line 2 to be safe (assumes 'use client' might be present)
        // The actual file processing will adjust if needed
        fileChanges.push({
          file: firstFile,
          action: 'add',
          lineNumber: 2,
          newCode: importMatch[0],
        })
      }
    }

    // Look for code replacement patterns
    const codeMatches = fixText.match(/```[\s\S]*?```/g)
    if (codeMatches && codeMatches.length >= 2) {
      // Assume first block is old code, second is new code
      const oldCode = codeMatches[0].replace(/```\w*\n?/g, '').trim()
      const newCode = codeMatches[1].replace(/```\w*\n?/g, '').trim()

      if (oldCode && newCode && oldCode !== newCode) {
        fileChanges.push({
          file: firstFile,
          action: 'replace',
          lineNumber: 10, // Default line number
          oldCode: oldCode.split('\n')[0], // First line only for safety
          newCode: newCode.split('\n')[0],
        })
      }
    }
  }

  console.log(`🔍 File path extraction results:`)
  console.log(`   Raw matches found: ${filePathMatches.length}`)
  console.log(`   Filtered matches: ${filteredMatches.length}`)
  console.log(`   Unique files: ${uniqueFiles.length}`)
  if (uniqueFiles.length > 0) {
    console.log(`   Files: [${uniqueFiles.join(', ')}]`)
  }
  console.log(
    `🔍 Extracted ${fileChanges.length} file changes from text response`
  )

  // If no valid files were found, log a warning
  if (uniqueFiles.length === 0 && fixText.toLowerCase().includes('import')) {
    console.warn(
      '⚠️ No valid file paths detected, but fix mentions imports. Consider extracting file path from error context.'
    )
  }

  return fileChanges
}

function parseTextResponse(content: string): {
  fix: string
  explanation: string
  fileChanges: FileChange[]
} {
  // Enhanced text parsing that also extracts file changes
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

  // Try to extract file changes from the parsed content
  const fileChanges = extractFileChangesFromText(fix || content, content)

  return {
    explanation: explanation || 'AI analysis provided',
    fix: fix || content,
    fileChanges,
  }
}

function getFallbackResponse(): {
  fix: string
  explanation: string
  fileChanges: FileChange[]
} {
  const isV0Mode = !!process.env.v0
  const requiredKey = isV0Mode ? 'VERCEL_API_TOKEN' : 'ANTHROPIC_API_KEY'
  const requiredPackage = isV0Mode ? '@ai-sdk/vercel' : '@ai-sdk/anthropic'

  return {
    explanation: `Auto-fix service requires ${requiredKey} environment variable to be set. Install AI SDK dependencies: npm install ai ${requiredPackage}`,
    fix: `1. Check the error message and stack trace carefully\n2. Verify your code syntax and imports\n3. Check Next.js documentation for similar issues\n4. Restart your development server\n5. Clear Next.js cache with \`rm -rf .next\`\n\nTo enable AI-powered auto-fix:\n1. Set ${requiredKey} environment variable\n2. Install dependencies: npm install ai ${requiredPackage}\n\nProvider selection:\n- Set v0=1 environment variable to use Vercel AI (requires VERCEL_API_TOKEN)\n- Default: Anthropic Claude (requires ANTHROPIC_API_KEY)`,
    fileChanges: [],
  }
}

function isValidFilePath(filePath: string, projectDir: string): boolean {
  // Check if the file path looks like a valid file path
  if (!filePath || typeof filePath !== 'string') {
    return false
  }

  // Must have a valid file extension
  if (!/\.(?:tsx?|jsx?|js|ts)$/.test(filePath)) {
    return false
  }

  const absolutePath = path.join(projectDir, filePath)
  if (!fs.existsSync(absolutePath)) {
    console.warn(`⚠️  File not found: ${absolutePath}`)
    return false
  }

  // Should either contain path separators or be a reasonable filename
  return filePath.includes('/') || filePath.length > 6
}

function extractFilePathFromPrompt(
  prompt: string,
  projectDir: string
): string | null {
  // Try to extract file path from error stack traces or error messages
  const patterns = [
    // Stack trace patterns like "at Component (/path/to/file.tsx:10:5)"
    /at\s+[^(]*\(([^:)]+\.(?:tsx?|jsx?|js|ts))/g,
    // Error message patterns like "Error in file.tsx"
    /(?:in|at|file|from)\s+([^\s]+\.(?:tsx?|jsx?|js|ts))/gi,
    // Module paths like "./components/Component.tsx"
    /(\.?\/[\w/-]+\.(?:tsx?|jsx?|js|ts))/g,
    // Absolute paths
    /([a-zA-Z]:)?\/[\w/-]+\.(?:tsx?|jsx?|js|ts)/g,
  ]

  for (const pattern of patterns) {
    const matches = prompt.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Extract just the file path part
        const pathMatch = match.match(/([^\s()]+\.(?:tsx?|jsx?|js|ts))/i)
        if (pathMatch && isValidFilePath(pathMatch[1], projectDir)) {
          // Convert absolute paths to relative if they're within common project dirs
          let filePath = pathMatch[1]
          if (
            filePath.includes('/app/') ||
            filePath.includes('/src/') ||
            filePath.includes('/pages/')
          ) {
            const parts = filePath.split('/')
            const relevantIndex = Math.max(
              parts.lastIndexOf('app'),
              parts.lastIndexOf('src'),
              parts.lastIndexOf('pages')
            )
            if (relevantIndex >= 0) {
              filePath = parts.slice(relevantIndex).join('/')
            }
          }
          return filePath
        }
      }
    }
  }

  return null
}

async function extractAndReadFileContents(
  prompt: string,
  projectDir: string
): Promise<{ path: string; content: string }[]> {
  const fileContents: { path: string; content: string }[] = []

  // Enhanced patterns to extract file paths from different error contexts
  const patterns = [
    // Direct file references
    /(?:in|file|update|change|modify|from|at)\s+([^\s]+\.(?:tsx?|jsx?|js|ts))/gi,
    // Stack trace patterns like "at Component (/path/to/file.tsx:10:5)"
    /at\s+[^(]*\(([^:)]+\.(?:tsx?|jsx?|js|ts))/g,
    // Module paths like "./components/Component.tsx"
    /(\.?\/[\w/-]+\.(?:tsx?|jsx?|js|ts))/g,
    // Error message patterns
    /Error in ([^\s]+\.(?:tsx?|jsx?|js|ts))/gi,
  ]

  const foundFiles = new Set<string>()

  for (const pattern of patterns) {
    const matches = prompt.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Extract the file path from the match
        let filePath = match.replace(/^(?:in|file|update|change|modify|from|at)\s+/i, '')
        filePath = filePath.replace(/^at\s+[^(]*\(/i, '').replace(/\)$/, '')
        filePath = filePath.replace(/['"`]/g, '').trim()
        
        // Clean up any remaining parentheses or line/column numbers
        filePath = filePath.replace(/:[\d:]+$/, '')
        
        if (filePath && isValidFilePath(filePath, projectDir)) {
          foundFiles.add(filePath)
        }
      }
    }
  }

  // Read the contents of found files
  for (const filePath of foundFiles) {
    try {
      const fullPath = path.resolve(projectDir, filePath)
      const content = await fsp.readFile(fullPath, 'utf8')
      fileContents.push({ path: filePath, content })
      console.log(`📄 Extracted content for: ${filePath}`)
    } catch (error) {
      console.warn(`⚠️  Could not read file ${filePath}:`, error)
    }
  }

  // If no files found via patterns, try the original extraction logic as fallback
  if (fileContents.length === 0) {
    const fallbackPath = extractFilePathFromPrompt(prompt, projectDir)
    if (fallbackPath && isValidFilePath(fallbackPath, projectDir)) {
      try {
        const fullPath = path.resolve(projectDir, fallbackPath)
        const content = await fsp.readFile(fullPath, 'utf8')
        fileContents.push({ path: fallbackPath, content })
        console.log(`📄 Extracted content via fallback for: ${fallbackPath}`)
      } catch (error) {
        console.warn(`⚠️  Could not read fallback file ${fallbackPath}:`, error)
      }
    }
  }

  return fileContents
}

function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.(.+)$/)
  return match ? match[1] : ''
}
