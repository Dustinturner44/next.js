/**
 * Generate expert prompts for detected boundary issues
 * These prompts can be copy-pasted to AI assistants for evaluation and fixes
 */

export interface SensitiveDataDetection {
  category: 'PASSWORD' | 'SECRET' | 'TOKEN' | 'API_KEY' | 'CREDENTIAL'
  propPaths: string[] // e.g., ["password", "config.credentials.password"]
  propValues: Record<string, string> // e.g., {"password": "user.credentials.password"}
  boundaryContext: {
    serverFile: string
    clientFile: string
    componentName: string
  }
}

export interface NonSerializableDetection {
  functionProps: string[] // e.g., ["onClick", "onSubmit"]
  propValues: Record<string, string> // e.g., {"onClick": "handleClick"}
  boundaryContext: {
    serverFile: string
    clientFile: string
    componentName: string
  }
}

/**
 * Generate expert prompt for sensitive data detection
 */
export function generateSensitiveDataPrompt(
  detection: SensitiveDataDetection
): string {
  const { category, propPaths, propValues, boundaryContext } = detection

  const propDetails = propPaths
    .map((path) => {
      const value = propValues[path]
      return value ? `\`${path}\` with value \`${value}\`` : `\`${path}\``
    })
    .join(', ')

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 EXPERT AI PROMPT - ${category} DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:
- Server Component: ${boundaryContext.serverFile}
- Client Component: ${boundaryContext.clientFile}
- Component Name: ${boundaryContext.componentName}
- Detected Props: ${propDetails}
- Pattern Matched: ${category}

═══════════════════════════════════════════════════════════════
SECTION 1: EVALUATE
═══════════════════════════════════════════════════════════════

Our heuristic detected potential ${category.toLowerCase()} data being passed
from a Server Component to a Client Component in a Next.js application.

Specifically, we found ${propPaths.length > 1 ? 'these props' : 'this prop'}:
${propPaths
  .map((path) => {
    const value = propValues[path]
    return `  • ${path}${value ? ` = {${value}}` : ''}`
  })
  .join('\n')}

This was flagged because the prop ${propPaths.length > 1 ? 'names contain' : 'name contains'}
patterns commonly associated with sensitive data.

Please evaluate:
1. Is this actually sensitive data that should not be sent to the client?
2. Could this create a security vulnerability if exposed in client-side code?
3. Is there a legitimate reason this data needs to be in a Client Component?
4. Are we creating a false positive with this heuristic?

Consider:
- Server Components run only on the server and can access secrets safely
- Client Components run in the browser where all props become visible
- Any data passed to Client Components is serialized and sent to the browser
- Even if not rendered, the data exists in the JavaScript bundle

═══════════════════════════════════════════════════════════════
SECTION 2: FIX
═══════════════════════════════════════════════════════════════

If you determined this is indeed sensitive data that shouldn't cross
the boundary, here are recommended fixes:

**Option 1: Keep Component as Server Component**
If the component doesn't need client-side interactivity, remove the
'use client' directive:

\`\`\`typescript
// ${boundaryContext.clientFile}
// Remove: 'use client'

export default function ${boundaryContext.componentName}(props) {
  // Component now runs on server, can safely access sensitive data
}
\`\`\`

**Option 2: Filter Sensitive Data Before Passing**
Only pass non-sensitive data to the Client Component:

\`\`\`typescript
// ${boundaryContext.serverFile}
<${boundaryContext.componentName}
  // Remove sensitive props:
${propPaths.map((path) => `  // ${path}={...}  // ❌ REMOVE`).join('\n')}

  // Only pass safe data needed for rendering
/>
\`\`\`

**Option 3: Use React Taint API (Experimental)**
Mark sensitive data as tainted to get runtime warnings:

\`\`\`typescript
// ${boundaryContext.serverFile}
import { experimental_taintObjectReference } from 'react'

${propPaths
  .map((path) => {
    const value = propValues[path]
    if (value && value.includes('.')) {
      // For nested paths like user.credentials.password
      const rootObj = value.split('.')[0]
      return `experimental_taintObjectReference(
  'Do not pass ${category.toLowerCase()} to client',
  ${rootObj}
)`
    }
    return `// Taint the ${path} data`
  })
  .join('\n')}
\`\`\`

**Option 4: Restructure Components**
Split into Server and Client parts:

\`\`\`typescript
// ${boundaryContext.serverFile}
export default function Page() {
  // Process sensitive data here
  const safeData = processSensitiveData()

  return <${boundaryContext.componentName} data={safeData} />
}
\`\`\`

Choose the option that best fits your use case. If unsure, Option 1
(Server Component) is the safest default.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Copy this entire prompt to your AI assistant for detailed analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

/**
 * Generate expert prompt for non-serializable function detection
 */
export function generateNonSerializablePrompt(
  detection: NonSerializableDetection
): string {
  const { functionProps, propValues, boundaryContext } = detection

  const propDetails = functionProps
    .map((prop) => {
      const value = propValues[prop]
      return value ? `\`${prop}\` with value \`${value}\`` : `\`${prop}\``
    })
    .join(', ')

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 EXPERT AI PROMPT - NON-SERIALIZABLE PROPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:
- Server Component: ${boundaryContext.serverFile}
- Client Component: ${boundaryContext.clientFile}
- Component Name: ${boundaryContext.componentName}
- Detected Function Props: ${propDetails}

═══════════════════════════════════════════════════════════════
SECTION 1: EVALUATE
═══════════════════════════════════════════════════════════════

Our heuristic detected function props being passed from a Server
Component to a Client Component in a Next.js application.

Specifically, we found ${functionProps.length > 1 ? 'these function props' : 'this function prop'}:
${functionProps
  .map((prop) => {
    const value = propValues[prop]
    return `  • ${prop}${value ? ` = {${value}}` : ''}`
  })
  .join('\n')}

This was flagged because functions cannot be serialized and sent from
server to client in Next.js.

Please evaluate:
1. Are these actually functions being passed as props?
2. Will this cause a runtime error or unexpected behavior?
3. Is there a valid pattern being used here (e.g., Server Actions)?
4. Is this a false positive from our type analysis?

Consider:
- Regular functions cannot be serialized across the network boundary
- Server Actions (functions with 'use server') are an exception
- Event handlers in Client Components should be defined client-side
- Callback props from Server → Client will fail at runtime

═══════════════════════════════════════════════════════════════
SECTION 2: FIX
═══════════════════════════════════════════════════════════════

If you determined these are indeed non-serializable functions, here
are recommended fixes:

**Option 1: Move Event Handlers to Client Component**
Define event handlers directly in the Client Component:

\`\`\`typescript
// ${boundaryContext.clientFile}
'use client'

export default function ${boundaryContext.componentName}() {
${functionProps
  .map((prop) => {
    return `  const ${prop} = () => {
    // Handle event client-side
  }`
  })
  .join('\n\n')}

  return <button ${functionProps.map((p) => `${p}={${p}}`).join(' ')} />
}
\`\`\`

**Option 2: Use Server Actions (if server-side logic needed)**
Convert to Server Actions with 'use server':

\`\`\`typescript
// ${boundaryContext.serverFile}
async function handleAction() {
  'use server'
  // Server-side logic here
}

<${boundaryContext.componentName}
${functionProps.map((prop) => `  ${prop}={handleAction}`).join('\n')}
/>
\`\`\`

**Option 3: Pass Data Instead of Functions**
If the function just provides data, pass the data directly:

\`\`\`typescript
// Instead of passing a getter function:
// ${functionProps.map((p) => `${p}={${propValues[p] || 'someFunc'}}`).join('\n// ')}

// Pass the data directly:
${functionProps
  .map(
    (prop) => `const ${prop}Data = ${propValues[prop] || 'getData'}()
<${boundaryContext.componentName} ${prop}={${prop}Data} />`
  )
  .join('\n')}
\`\`\`

**Option 4: Remove Unnecessary Props**
If the function isn't needed, simply remove it:

\`\`\`typescript
<${boundaryContext.componentName}
${functionProps.map((prop) => `  // ${prop}={...}  // ❌ REMOVE - not needed`).join('\n')}
/>
\`\`\`

For most cases, Option 1 (client-side handlers) or Option 2 (Server
Actions) are the correct approaches.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Copy this entire prompt to your AI assistant for detailed analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}
