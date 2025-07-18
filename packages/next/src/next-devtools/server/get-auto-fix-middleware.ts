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
      console.log('🔨 Auto Fix Request Body:', body)
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
    
    // Extract additional context from rendered states if available
    const renderedStatesContext = extractRenderedStatesFromPrompt(prompt, projectDir)
    
    // Detect if this is a hydration error
    const isHydrationError = detectHydrationError(prompt)
    
    // Detect if this is a client component error
    const isClientComponentError = detectClientComponentError(prompt)
    
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
${renderedStatesContext}

IMPORTANT: The above files show the CURRENT state. Use this context to:
1. Understand existing directives ('use client', 'use server') and their positions
2. See what imports already exist to avoid duplicates
3. Understand the current code structure and patterns
4. Generate fixes that work with the existing code state
5. Place new imports correctly based on existing directive placement
6. Check if useState, useEffect, or other hooks already exist before adding them
${isHydrationError ? '\n7. HYDRATION ERROR DETECTED - Focus on server/client consistency fixes' : ''}
${isClientComponentError ? '\n8. CLIENT COMPONENT ERROR DETECTED - Add \'use client\' directive if missing' : ''}
${renderedStatesContext ? '\n9. RENDERED STATES CONTEXT - Check the additional files from recently rendered components' : ''}
`
    } else {
      console.log('📂 No file contents extracted from error context')
      
      // If we have rendered states context but no file contents, still include it
      if (renderedStatesContext) {
        fileContextSection = `
${renderedStatesContext}

IMPORTANT: No direct file contents were found in the error context, but rendered component states are available above.
${isHydrationError ? '\nHYDRATION ERROR DETECTED - Focus on server/client consistency fixes' : ''}
${isClientComponentError ? '\nCLIENT COMPONENT ERROR DETECTED - Add \'use client\' directive if missing' : ''}

The rendered states may help identify which files are involved in this error.
`
      }
    }

    // Enhanced prompt using v0's Next.js expertise
    const enhancedPrompt = `
You are v0, an advanced Next.js expert AI assistant with deep knowledge of React, TypeScript, and modern web development patterns. 

IMPORTANT: This is a fresh request with NO prior context or memory. The file contents shown below represent the CURRENT, LATEST state of the files. Analyze only what is provided in this request.

Fix the following development error:

${prompt}
${fileContextSection}
CRITICAL INSTRUCTIONS:
- This is an independent request - ignore any previous conversations or context
- The file contents above show the EXACT current state - treat this as the source of truth
- Fix the ROOT CAUSE of the error, never just add try-catch blocks
- Apply v0's best practices for Next.js development
- Provide production-ready, optimized code solutions
- Use modern React patterns and TypeScript when applicable
- ANALYZE ONLY the current file contents shown above to understand the existing state
- NEVER add code that already exists - check the file contents carefully!

CLIENT COMPONENT ERROR EXPERTISE:
If error mentions "only works in a Client Component" or "none of its parents are marked with 'use client'":
- Add 'use client' directive at the very top of the file (line 1)
- This applies to: useState, useEffect, onClick handlers, window/document APIs, browser events
- 'use client' must be the first line, before any imports or other code
- Only add if the file doesn't already have 'use client' directive
- This converts Server Component to Client Component for interactivity

HYDRATION ERROR EXPERTISE:
If this is a hydration mismatch error, follow these specific patterns:
- Use useState + useEffect pattern for client-only values
- Initialize with server-safe default values (empty string, null, false)
- Move dynamic content (Date.now(), Math.random(), window APIs) inside useEffect
- Use dynamic imports with ssr: false for client-only components
- Consider suppressHydrationWarning only for unavoidable mismatches
- NEVER use typeof window checks in render - use useEffect instead

DUPLICATE CODE PREVENTION:
Before suggesting any import or code addition:
1. Check if the import already exists in the file contents
2. Check if the function/variable is already defined
3. Check if the useEffect or useState already handles the case
4. Only suggest additions for truly missing code
5. If code exists but is incorrect, use "replace" action instead of "add"

IMPORT RECONCILIATION (NEW CAPABILITY):
The system now intelligently merges imports from the same module:
- If file has: import { useState } from "react"
- And you suggest: import React from "react" 
- System will merge to: import React, { useState } from "react"
- Similarly: import { useEffect } from "react" + existing useState = import { useState, useEffect } from "react"
- Feel free to suggest imports even if the module is already imported - the system will merge them properly

DIRECTIVE PLACEMENT RULES (CRITICAL):
- React directives ("use client", "use server", "use strict") MUST be at the very top of the file
- NEVER insert imports, comments, or any code before directives
- When adding imports to files with directives:
  * Keep directives at line 1
  * Insert imports starting at line 2 (after directives)
  * Maintain blank line between directives and imports if it exists
- If no directives exist, imports go at line 1 as normal
- CHECK the current file contents to see if directives already exist!

RESPONSE FORMAT (CRITICAL - MUST be valid JSON ONLY):

You MUST respond with ONLY valid JSON - no explanatory text before or after. The response must be parseable with JSON.parse().

Required JSON structure:
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

CRITICAL JSON RULES:
- Start response with { and end with }
- Use double quotes for all strings
- Escape quotes inside strings with \"
- No trailing commas
- No comments or extra text
- Test your JSON mentally before responding

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

🖱️ CLIENT COMPONENT ERROR PATTERNS:

❌ Bad: Server Component with client features
import { useState } from 'react'

export default function MyComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

✅ v0: Add 'use client' directive first
'use client'

import { useState } from 'react'

export default function MyComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

🔄 HYDRATION ERROR PATTERNS:

❌ Bad: Server/client content differs
function BadComponent() {
  return <div>{new Date().toISOString()}</div>
}

✅ v0: Server-safe with useEffect
function GoodComponent() {
  const [time, setTime] = useState('')
  useEffect(() => setTime(new Date().toISOString()), [])
  return <div>{time || 'Loading...'}</div>
}

❌ Bad: typeof window in render
function BadComponent() {
  return <div>{typeof window !== 'undefined' && window.innerWidth}</div>
}

✅ v0: Client-only with useEffect
function GoodComponent() {
  const [width, setWidth] = useState(0)
  useEffect(() => setWidth(window.innerWidth), [])
  return <div>{width || 'Loading...'}</div>
}

❌ Bad: Random values in render
function BadComponent() {
  return <div>Random: {Math.random()}</div>
}

✅ v0: Random in useEffect
function GoodComponent() {
  const [random, setRandom] = useState(0)
  useEffect(() => setRandom(Math.random()), [])
  return <div>Random: {random}</div>
}

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

FINAL REMINDER: Your response must be ONLY valid JSON. Start with { and end with }. No markdown, no explanations, just pure JSON.
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

    // Clean up common JSON formatting issues
    let cleanedContent = content.trim()
    
    // Remove any text before the first {
    const firstBrace = cleanedContent.indexOf('{')
    if (firstBrace > 0) {
      console.log('⚠️  Removing text before JSON object')
      cleanedContent = cleanedContent.substring(firstBrace)
    }
    
    // Remove any text after the last }
    const lastBrace = cleanedContent.lastIndexOf('}')
    if (lastBrace >= 0 && lastBrace < cleanedContent.length - 1) {
      console.log('⚠️  Removing text after JSON object')
      cleanedContent = cleanedContent.substring(0, lastBrace + 1)
    }

    // Try to parse as JSON first, fallback to plain text
    try {
      const parsedResponse = JSON.parse(cleanedContent)

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
      console.log('🔍 Cleaned content for debugging:')
      console.log(cleanedContent.slice(0, 800) + (cleanedContent.length > 800 ? '...' : ''))
      
      // Look for obvious JSON issues
      if (cleanedContent.includes('"')) {
        console.log('💡 Content contains quotes - may be escaping issue')
      }
      if (cleanedContent.includes('`')) {
        console.log('💡 Content contains backticks - AI may have used markdown code blocks')
      }
      if (!cleanedContent.startsWith('{')) {
        console.log('💡 Content does not start with { - AI may have added explanatory text')
      }
      
      // Try one more time with common fixes
      try {
        console.log('🔧 Attempting to fix common JSON issues...')
        let fixedContent = cleanedContent
        
        // Fix backticks in code blocks (common AI mistake)
        fixedContent = fixedContent.replace(/`/g, '\\"')
        
        // Fix unescaped quotes in strings
        fixedContent = fixedContent.replace(/"([^"]*)"([^",}]*)"([^"]*)":/g, '"$1\\"$2\\"$3":')
        
        // Try parsing the fixed version
        const parsedResponse = JSON.parse(fixedContent)
        console.log('✅ Successfully parsed JSON after fixes')
        
        return {
          fix: parsedResponse.fix || fixedContent,
          explanation: parsedResponse.explanation || 'Generated by AI (fixed)',
          fileChanges: parsedResponse.fileChanges || [],
        }
      } catch (secondParseError) {
        console.log('❌ Still failed to parse after fixes, falling back to text parsing')
        // If not JSON, treat as plain text and extract useful parts
        return parseTextResponse(content)
      }
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

    // Handle import reconciliation for smart merging
    if (change.newCode.trim().startsWith('import ')) {
      const reconciledResult = reconcileImports(lines, change.newCode.trim(), fileName)
      if (reconciledResult.shouldSkip) {
        console.log(`⚠️  Import already exists in ${fileName}, skipping addition`)
        return false
      }
      
      if (reconciledResult.shouldReplace) {
        // Replace existing import with merged version
        const existingLineIndex = reconciledResult.existingLineIndex!
        lines[existingLineIndex] = reconciledResult.mergedImport!
        console.log(`✓ Merged imports in ${fileName}:`)
        console.log(`   Original: ${reconciledResult.originalImport}`)
        console.log(`   New: ${reconciledResult.mergedImport}`)
        return true
      }
      
      // If we get here, it's a new import that should be added normally
    }

    // Check for duplicate 'use client' directive
    if (change.newCode.trim() === "'use client'") {
      const hasUseClient = lines.some(line => 
        line.trim() === "'use client'" || line.trim() === '"use client"'
      )
      
      if (hasUseClient) {
        console.log(`⚠️  'use client' directive already exists in ${fileName}, skipping addition`)
        return false
      }
    }

    // Check for duplicate function/variable declarations
    if (change.newCode.includes('useState') || change.newCode.includes('useEffect')) {
      const hookPattern = /const\s+\[([^\]]+)\]/
      const match = change.newCode.match(hookPattern)
      if (match) {
        const variableName = match[1].split(',')[0].trim()
        const existingDeclaration = lines.find(line => 
          line.includes(`[${variableName}`) || line.includes(`${variableName},`)
        )
        
        if (existingDeclaration) {
          console.log(`⚠️  Variable "${variableName}" already declared in ${fileName}, skipping addition`)
          return false
        }
      }
    }

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

interface ImportReconcileResult {
  shouldSkip: boolean
  shouldReplace: boolean
  existingLineIndex?: number
  originalImport?: string
  mergedImport?: string
}

function reconcileImports(lines: string[], newImport: string, fileName: string): ImportReconcileResult {
  // Parse the new import statement
  const newImportInfo = parseImportStatement(newImport)
  if (!newImportInfo) {
    return { shouldSkip: false, shouldReplace: false }
  }

  // Find existing imports from the same module
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('import ')) {
      const existingImportInfo = parseImportStatement(line)
      if (existingImportInfo && existingImportInfo.from === newImportInfo.from) {
        // Found an import from the same module
        console.log(`🔍 Found existing import from "${newImportInfo.from}":`)
        console.log(`   Existing: ${line}`)
        console.log(`   New: ${newImport}`)

        // Check if we're trying to add something that already exists
        const isCompletelyDuplicate = 
          (newImportInfo.defaultImport && existingImportInfo.defaultImport === newImportInfo.defaultImport) ||
          (newImportInfo.namedImports.length > 0 && 
           newImportInfo.namedImports.every(imp => existingImportInfo.namedImports.includes(imp)))

        if (isCompletelyDuplicate) {
          return { shouldSkip: true, shouldReplace: false }
        }

        // Merge the imports
        const mergedImport = mergeImportStatements(existingImportInfo, newImportInfo)
        return {
          shouldSkip: false,
          shouldReplace: true,
          existingLineIndex: i,
          originalImport: line,
          mergedImport
        }
      }
    }
  }

  // No existing import found, should add normally
  return { shouldSkip: false, shouldReplace: false }
}

interface ImportInfo {
  defaultImport?: string
  namedImports: string[]
  from: string
  originalStatement: string
}

function parseImportStatement(importStatement: string): ImportInfo | null {
  const importRegex = /import\s+(.*?)\s+from\s+['"]([^'"]+)['"]/
  const match = importStatement.match(importRegex)
  
  if (!match) return null

  const importClause = match[1].trim()
  const from = match[2]
  let defaultImport: string | undefined
  let namedImports: string[] = []

  // Handle different import patterns
  if (importClause.includes('{')) {
    // Has named imports: import React, { useState, useEffect } from 'react'
    const defaultMatch = importClause.match(/^([^,{]+),/)
    if (defaultMatch) {
      defaultImport = defaultMatch[1].trim()
    }
    
    const namedMatch = importClause.match(/\{([^}]+)\}/)
    if (namedMatch) {
      namedImports = namedMatch[1]
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
    }
  } else {
    // Default import only: import React from 'react'
    defaultImport = importClause.trim()
  }

  return {
    defaultImport,
    namedImports,
    from,
    originalStatement: importStatement
  }
}

function mergeImportStatements(existing: ImportInfo, newImport: ImportInfo): string {
  let defaultImport = existing.defaultImport || newImport.defaultImport
  
  // Merge named imports, removing duplicates
  const allNamedImports = [...new Set([...existing.namedImports, ...newImport.namedImports])]
  
  // Construct the merged import statement
  let importClause = ''
  
  if (defaultImport && allNamedImports.length > 0) {
    importClause = `${defaultImport}, { ${allNamedImports.join(', ')} }`
  } else if (defaultImport) {
    importClause = defaultImport
  } else if (allNamedImports.length > 0) {
    importClause = `{ ${allNamedImports.join(', ')} }`
  }
  
  return `import ${importClause} from '${existing.from}'`
}

function extractRenderedStatesFromPrompt(prompt: string, projectDir: string): string {
  // Look for the "Recently Rendered Components" section
  const renderedStatesMatch = prompt.match(/## Recently Rendered Components\n([\s\S]*?)(?:\n\n|$)/i)
  
  if (!renderedStatesMatch) {
    return ''
  }
  
  const renderedStatesSection = renderedStatesMatch[1]
  console.log('🎯 Found rendered states context in error prompt')
  
  // Parse the rendered states to extract potential file paths
  const stateLines = renderedStatesSection.split('\n').filter(line => line.trim().startsWith('-'))
  const potentialFiles = new Set<string>()
  
  stateLines.forEach(line => {
    // Extract page path from format: "- type (pagePath) [boundaryType] - timestamp"
    const pagePathMatch = line.match(/\(([^)]+)\)/)
    if (pagePathMatch) {
      const pagePath = pagePathMatch[1].trim()
      // Convert page path to potential file paths
      if (pagePath.startsWith('/')) {
        // Convert route path to file path
        const appPath = `app${pagePath === '/' ? '/page' : pagePath}/page.tsx`
        const srcPath = `src/app${pagePath === '/' ? '/page' : pagePath}/page.tsx`
        potentialFiles.add(appPath)
        potentialFiles.add(srcPath)
      }
    }
  })
  
  if (potentialFiles.size > 0) {
    console.log(`📂 Extracted ${potentialFiles.size} potential file paths from rendered states:`)
    Array.from(potentialFiles).forEach(file => console.log(`   - ${file}`))
    
    return `\nADDITIONAL CONTEXT FROM RENDERED STATES:
The following files were recently rendered and may be related to this error:
${Array.from(potentialFiles).map(file => `- ${file}`).join('\n')}

Note: Since the call stack was not helpful, these recently rendered component paths have been included as potential sources of the error.`
  }
  
  return ''
}

function extractFilePathsFromRenderedStates(prompt: string, projectDir: string): string[] {
  // Look for the "Recently Rendered Components" section
  const renderedStatesMatch = prompt.match(/## Recently Rendered Components\n([\s\S]*?)(?:\n\n|$)/i)
  
  if (!renderedStatesMatch) {
    return []
  }
  
  const renderedStatesSection = renderedStatesMatch[1]
  const stateLines = renderedStatesSection.split('\n').filter(line => line.trim().startsWith('-'))
  const potentialFiles: string[] = []
  
  stateLines.forEach(line => {
    // Extract page path from format: "- type (pagePath) [boundaryType] - timestamp"
    const pagePathMatch = line.match(/\(([^)]+)\)/)
    if (pagePathMatch) {
      const pagePath = pagePathMatch[1].trim()
      // Convert page path to potential file paths
      if (pagePath.startsWith('/')) {
        // Convert route path to file path
        const appPath = `app${pagePath === '/' ? '/page' : pagePath}/page.tsx`
        const srcPath = `src/app${pagePath === '/' ? '/page' : pagePath}/page.tsx`
        
        // Check if files exist and add them
        if (fs.existsSync(path.resolve(projectDir, appPath))) {
          potentialFiles.push(appPath)
        }
        if (fs.existsSync(path.resolve(projectDir, srcPath))) {
          potentialFiles.push(srcPath)
        }
      }
    }
  })
  
  return [...new Set(potentialFiles)] // Remove duplicates
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

  // Skip obvious function/variable names
  if (filePath.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\.(?:tsx?|jsx?|js|ts)$/)) {
    console.log(`🔍 Skipping apparent function/variable name: ${filePath}`)
    return false
  }

  const absolutePath = path.join(projectDir, filePath)
  if (!fs.existsSync(absolutePath)) {
    // Only log if the path looks reasonable (not a mangled extraction)
    if (filePath.includes('/') && !filePath.includes('(') && filePath.length > 6) {
      console.log(`📂 File not found (extracted path): ${filePath}`)
    }
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
    // Stack trace patterns like "at Component (/path/to/file.tsx:10:5)" - more precise
    /at\s+[^(]*\(([^:)]*\/[^:)]*\.(?:tsx?|jsx?|js|ts))(?::\d+)*\)/g,
    // Module paths like "./components/Component.tsx" or "app/page.tsx"
    /(?:^|\s|['"`])((?:\.?\/)?(?:[\w-]+\/)*[\w-]+\.(?:tsx?|jsx?|js|ts))(?:['"`]|\s|$|:)/g,
    // Error message patterns with better boundaries
    /(?:Error in|file|from)\s+(['"`]?)([^'"`\s()]+\.(?:tsx?|jsx?|js|ts))\1/gi,
    // Direct file references with word boundaries
    /\b((?:app|src|pages)\/(?:[\w-]+\/)*[\w-]+\.(?:tsx?|jsx?|js|ts))\b/g,
  ]

  for (const pattern of patterns) {
    const matches = Array.from(prompt.matchAll(pattern))
    if (matches.length > 0) {
      for (const match of matches) {
        // Get the captured file path (different capture group for different patterns)
        let filePath = match[1] || match[2] || match[0]
        
        // Clean up the file path
        filePath = filePath.replace(/['"`]/g, '').trim()
        filePath = filePath.replace(/:[\d:]+$/, '') // Remove line:column numbers
        filePath = filePath.replace(/^\s*at\s+[^(]*\(/, '') // Remove stack trace prefix
        filePath = filePath.replace(/\)$/, '') // Remove trailing parenthesis
        
        // Skip if this looks like a function name rather than a file path
        if (filePath && !filePath.includes('(') && !filePath.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
          // Validate and normalize the file path
          const normalizedPath = normalizeFilePath(filePath, projectDir)
          if (normalizedPath && isValidFilePath(normalizedPath, projectDir)) {
            return normalizedPath
          }
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
    // Stack trace patterns like "at Component (/path/to/file.tsx:10:5)" - more precise
    /at\s+[^(]*\(([^:)]*\/[^:)]*\.(?:tsx?|jsx?|js|ts))(?::\d+)*\)/g,
    // Module paths like "./components/Component.tsx" or "app/page.tsx"
    /(?:^|\s|['"`])((?:\.?\/)?(?:[\w-]+\/)*[\w-]+\.(?:tsx?|jsx?|js|ts))(?:['"`]|\s|$|:)/g,
    // Error message patterns with better boundaries
    /(?:Error in|file|from)\s+(['"`]?)([^'"`\s()]+\.(?:tsx?|jsx?|js|ts))\1/gi,
    // Direct file references with word boundaries
    /\b((?:app|src|pages)\/(?:[\w-]+\/)*[\w-]+\.(?:tsx?|jsx?|js|ts))\b/g,
  ]

  const foundFiles = new Set<string>()

  for (const pattern of patterns) {
    const matches = Array.from(prompt.matchAll(pattern))
    if (matches) {
      for (const match of matches) {
        // Get the captured file path (different capture group for different patterns)
        let filePath = match[1] || match[2] || match[0]
        
        // Clean up the file path
        filePath = filePath.replace(/['"`]/g, '').trim()
        filePath = filePath.replace(/:[\d:]+$/, '') // Remove line:column numbers
        filePath = filePath.replace(/^\s*at\s+[^(]*\(/, '') // Remove stack trace prefix
        filePath = filePath.replace(/\)$/, '') // Remove trailing parenthesis
        
        // Skip if this looks like a function name rather than a file path
        if (filePath && !filePath.includes('(') && !filePath.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
          // Validate and normalize the file path
          const normalizedPath = normalizeFilePath(filePath, projectDir)
          if (normalizedPath && isValidFilePath(normalizedPath, projectDir)) {
            foundFiles.add(normalizedPath)
          }
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
  
  // If still no files found, try extracting from rendered states context
  if (fileContents.length === 0) {
    const renderedStatesPaths = extractFilePathsFromRenderedStates(prompt, projectDir)
    for (const filePath of renderedStatesPaths) {
      try {
        const fullPath = path.resolve(projectDir, filePath)
        if (fs.existsSync(fullPath)) {
          const content = await fsp.readFile(fullPath, 'utf8')
          fileContents.push({ path: filePath, content })
          console.log(`📄 Extracted content from rendered states: ${filePath}`)
        }
      } catch (error) {
        console.warn(`⚠️  Could not read rendered states file ${filePath}:`, error)
      }
    }
  }

  return fileContents
}

function normalizeFilePath(filePath: string, projectDir: string): string | null {
  if (!filePath) return null
  
  // Remove any leading/trailing whitespace and quotes
  filePath = filePath.trim().replace(/^['"`]/, '').replace(/['"`]$/, '')
  
  // If it's already a relative path starting with common directories, return as-is
  if (filePath.match(/^(?:app|src|pages|components|lib|utils)\//)) {
    return filePath
  }
  
  // If it's an absolute path, try to extract the relative part
  if (filePath.startsWith('/')) {
    const parts = filePath.split('/')
    const relevantDirs = ['app', 'src', 'pages', 'components', 'lib', 'utils']
    
    for (const dir of relevantDirs) {
      const dirIndex = parts.lastIndexOf(dir)
      if (dirIndex >= 0) {
        return parts.slice(dirIndex).join('/')
      }
    }
    
    // If no relevant directory found, try to get the last few parts that look like a file path
    const fileIndex = parts.findIndex(part => part.includes('.'))
    if (fileIndex > 0) {
      return parts.slice(Math.max(0, fileIndex - 2)).join('/')
    }
  }
  
  // If it starts with ./ or ../, clean it up
  if (filePath.startsWith('./')) {
    filePath = filePath.substring(2)
  }
  
  return filePath
}

function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.(.+)$/)
  return match ? match[1] : ''
}

function detectHydrationError(prompt: string): boolean {
  const hydrationKeywords = [
    'hydration',
    'Text content does not match',
    'Warning: Text content did not match',
    'Server HTML',
    'client-side rendering',
    'suppressHydrationWarning',
    'Expected server HTML',
    'Hydration failed',
    'hydrating',
    'different on server',
    'server and client'
  ]
  
  const lowerPrompt = prompt.toLowerCase()
  return hydrationKeywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()))
}

function detectClientComponentError(prompt: string): boolean {
  const clientComponentKeywords = [
    'only works in a client component',
    'none of its parents are marked with "use client"',
    'server components by default',
    'usestate',
    'useeffect',
    'onclick',
    'onchange',
    'window is not defined',
    'document is not defined',
    'cannot read properties of undefined (reading \'addeventlistener\')',
    'referenceerror: window is not defined',
    'referenceerror: document is not defined'
  ]
  
  const lowerPrompt = prompt.toLowerCase()
  return clientComponentKeywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()))
}
