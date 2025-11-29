# Boundary Type Analysis - Implementation Documentation

## Overview

This document captures the complete implementation of TypeScript type analysis for server→client component boundaries in Next.js. The system detects when sensitive data (passwords, API keys, tokens, etc.) is being passed from Server Components to Client Components.

## Problem Statement

When passing props from Server Components to Client Components in Next.js:

- Developers may accidentally pass sensitive data that shouldn't be serialized and sent to the client
- The component interface may accept `any` types, making static analysis difficult
- Sensitive data may be nested deep in object structures
- Variable names may not match prop names (e.g., `x={apiKey}`)

## Solution Architecture

### High-Level Flow

1. **Turbopack** detects server→client boundaries and JSX call site locations
2. **JSX Location Finder** extracts the exact position of client component usage
3. **TypeScript Type Resolver** analyzes the types of expressions being passed
4. **Sensitive Data Detector** recursively checks for sensitive patterns
5. **Formatter** displays findings with source tracking

### Key Files

- `packages/next/src/server/boundary-analysis/type-resolver.ts` - TypeScript type analysis
- `packages/next/src/server/boundary-analysis/index.ts` - Formatting and display
- `packages/next/src/server/dev/hot-reloader-turbopack.ts` - Integration point

## Complete Specification

### Core Principle: Analyze Expression Types, Not Component Interface

**Wrong approach**: Analyze the component's props interface type

```typescript
interface ComponentProps {
  data: any // Component accepts any
}
```

**Correct approach**: Analyze the actual expression being passed

```typescript
<Component data={user} />  // Analyze typeof user, not ComponentProps
```

### Type-Based Analysis Rules

#### For PRIMITIVE Types

- **String, Number, Boolean, Literals, Null, Undefined, Void, Any**
- Check the **property/variable NAME** against sensitive patterns
- Patterns: `/password/i`, `/secret/i`, `/token/i`, `/apikey/i`, `/credential/i`

**Simple identifier example**:

```typescript
const apiKey = "sk-123"
<Component x={apiKey} />
// ✓ Check "apiKey" → matches /apikey/ → SENSITIVE
// Display: x=apiKey
```

**Property chain example**:

```typescript
<Component y={user.credentials.password} />
// ✓ Type is string (primitive)
// ✓ Check ONLY last property "password" → matches /password/ → SENSITIVE
// ✓ Do NOT check "user" or "credentials"
// Display: y=user.credentials.password
```

#### For OBJECT Types

- Recursively traverse ALL nested properties
- Check each nested property KEY at every depth
- Track source for proper display

**Example**:

```typescript
const user = {
  credentials: {
    password: "secret",
    apiToken: "token123"
  }
}
<Component z={user} />
// ✓ Recursive analysis finds:
//   - credentials.password (key "password" matches)
//   - credentials.apiToken (key "apiToken" matches)
// Display: (z=user).credentials.password, (z=user).credentials.apiToken
```

#### For FUNCTION Types

- Warn that the function is non-serializable
- Applies at any depth (top-level or nested in objects)

### No Duplicate Detections

**Problem**: Analyzing both prop AND identifier with same type

```typescript
<Component z={user} />
// ❌ Wrong: Analyze "z" AND "user" separately → duplicate detections
```

**Solution**: Only analyze the prop with the expression's type

```typescript
<Component z={user} />
// ✓ Analyze "z" with typeof user → detects (z=user).credentials.password
// ✓ Do NOT separately analyze "user" identifier
```

### Display Format Specification

**Object type detections**:

- Format: `(propName=identifier).nested.path`
- Example: `(z=user).credentials.password`
- Shows both the prop name AND the identifier being passed

**Primitive type detections**:

- Format: `propName=expression`
- Example: `x=apiKey` or `y=user.credentials.password`
- Shows the full expression being passed

## Implementation Details

### Type Resolution Flow

```typescript
// 1. Get JSX element at location
const jsxElement = findJsxElement(node, typescript)
const openingElement = jsxElement.openingElement

// 2. Process each attribute
for (const attr of openingElement.attributes.properties) {
  const propName = attr.name.getText(sourceFile)
  const expression = attr.initializer.expression
  const exprText = expression.getText(sourceFile)

  // 3. Get the TYPE of the expression
  const exprType = typeChecker.getTypeAtLocation(expression)

  // 4. Determine if primitive or object
  const isPrimitive = (exprType.flags & typescript.TypeFlags.String) !== 0 || ...
  const isObjectType = !isPrimitive && !isFunctionType && properties.length > 0

  // 5. Route to appropriate handler
  if (isObjectType) {
    // Recursive type analysis with source tracking
    const sourcePrefix = `(${propName}=${exprText})`
    analyzePropType(propName, exprType, ..., sourcePrefix, sensitiveSource)
  } else {
    // Check identifier/property name
    if (isIdentifier(expression)) {
      // Check identifier: x={apiKey}
      checkAndRecord("apiKey", ..., source: "x=apiKey")
    } else if (isPropertyAccessExpression(expression)) {
      // Check last property: y={user.credentials.password}
      const lastProp = expression.name.getText()
      checkAndRecord("password", ..., source: "y=user.credentials.password")
    }
  }
}
```

### Data Structures

```typescript
interface PropsTypeInfo {
  typeString: string                    // Type signature
  propNames: string[]                    // Prop names
  sensitiveFlags: { ... }                // Boolean flags for each category
  sensitiveProps: {                      // Arrays of detected paths
    password: string[]                   // e.g., ["z.credentials.password", "apiKey"]
    secret: string[]
    token: string[]
    apiKey: string[]
    credential: string[]
  }
  propValues: Record<string, string>     // Prop → expression text
  sensitiveSource: Record<string, string> // Path → source display
}
```

**Key insight**: `sensitiveProps` arrays contain **full paths** (like `"z.credentials.password"`), and `sensitiveSource` maps those same full paths to display strings (like `"(z=user).credentials.password"`).

### Recursive Type Analysis

```typescript
function analyzePropType(
  propPath: string, // Current property name
  propType: ts.Type, // TypeScript type
  ...pathPrefix: string, // Path so far: "" → "z" → "z.credentials"
  sourcePrefix: string, // Display prefix: "(z=user)"
  sourceMap: Record<string, string>
): void {
  const fullPath = pathPrefix ? `${pathPrefix}.${propPath}` : propPath

  if (isPrimitive) {
    // Check property name
    if (patterns.password.test(propPath)) {
      propsMap.password.push(fullPath) // Store "z.credentials.password"

      // Build source path
      const dotIndex = fullPath.indexOf('.')
      const sourcePath =
        dotIndex !== -1
          ? `${sourcePrefix}${fullPath.substring(dotIndex)}`
          : `${sourcePrefix}.${propPath}`

      sourceMap[fullPath] = sourcePath // Map to display format
    }
    return
  }

  if (isObject) {
    // Recurse into nested properties
    for (const nestedProp of propType.getProperties()) {
      analyzePropType(
        nestedProp.getName(),
        nestedProp.getType(),
        ...fullPath, // Extend path: "z" → "z.credentials"
        sourcePrefix, // Keep same source: "(z=user)"
        sourceMap
      )
    }
  }
}
```

### Source Path Construction

For nested detections like `z.credentials.password` where source is `(z=user)`:

```typescript
fullPath = "z.credentials.password"
sourcePrefix = "(z=user)"
dotIndex = fullPath.indexOf('.') = 1
nestedPart = fullPath.substring(1) = ".credentials.password"
sourcePath = "(z=user)" + ".credentials.password" = "(z=user).credentials.password"
```

## Test Cases

### Test Setup

```typescript
// page.tsx (Server Component)
const apiKey = process.env.API_KEY
const user = getUser()  // Returns { credentials: { password: string, apiToken: string } }

<ClientButton
  label="Click me"
  count={42}
  z={user}
  x={apiKey}
  y={user.credentials.password}
/>

// ClientButton.tsx (Client Component)
export default function ClientButton({ label, count }) {
  // No type annotations - accepts any
}
```

### Expected Output

```
⚠️  SENSITIVE DATA DETECTED:
   - PASSWORD ((z=user).credentials.password)
   - TOKEN ((z=user).credentials.apiToken)
   - API_KEY (x=apiKey)
   - PASSWORD (y=user.credentials.password)
```

**Explanation**:

- `(z=user).credentials.password` - From object type recursive analysis
- `(z=user).credentials.apiToken` - From object type recursive analysis
- `x=apiKey` - From primitive identifier check
- `y=user.credentials.password` - From primitive property chain check (last property "password")

## Key Technical Decisions

### 1. Why Analyze Expression Types?

**Alternative**: Analyze component's props interface
**Problem**: Components may accept `any` or loose types
**Solution**: Analyze the actual expressions being passed - they have accurate types

### 2. Why Check Last Property Only for Primitives?

**Alternative**: Check all properties in chain `user.credentials.password`
**Problem**: False positives from intermediate identifiers like "user"
**Solution**: For primitives, only check the final property name

**Rationale**: The type analysis already handles nested paths in objects. For primitives, the last property name is most indicative of the data being passed.

### 3. Why Separate Object and Primitive Handling?

**Objects**: Need full recursive traversal to find nested sensitive fields
**Primitives**: Simple name checking sufficient, recursion not applicable

### 4. Why Track Sources?

**Problem**: Output like "PASSWORD (password)" is ambiguous
**Solution**: Show the source: `(z=user).credentials.password` clearly indicates:

- Prop name: `z`
- Identifier: `user`
- Nested path: `.credentials.password`

### 5. Why Use TypeScript Type Flags?

**Alternative**: Check if `getProperties().length > 0`
**Problem**: String types have methods (properties), incorrectly treated as objects
**Solution**: Check `TypeFlags.String`, `TypeFlags.Number`, etc. for primitives

## Evolution History

### Phase 1: Initial Approach (Naive)

- Checked component interface types
- Only checked top-level prop names
- **Problem**: Missed sensitive data in nested objects

### Phase 2: Recursive Type Analysis

- Added recursive traversal of object types
- Checked all nested property keys
- **Problem**: Still used component interface, not expression types

### Phase 3: Expression Type Analysis

- Switched to analyzing actual expression types
- Used `typeChecker.getTypeAtLocation(expression)`
- **Problem**: Double-counted detections, confusing output

### Phase 4: Final Implementation (Current)

- Expression-based with source tracking
- No duplicates
- Clear display format showing sources
- Proper primitive vs object detection

## Code Structure

### Main Function: `resolvePropsType()`

**Responsibilities**:

1. Set up TypeScript program and type checker
2. Find JSX element at specified location
3. Iterate through JSX attributes
4. For each attribute:
   - Get expression type
   - Determine if object/primitive/function
   - Route to appropriate handler
   - Track source information
5. Return complete analysis results

### Helper Function: `analyzePropType()`

**Responsibilities**:

1. Recursively traverse object type structures
2. Check property names against sensitive patterns
3. Build full paths (e.g., `z.credentials.password`)
4. Build source paths (e.g., `(z=user).credentials.password`)
5. Handle function type warnings

### Helper Function: `matchesSensitivePattern()`

**Responsibilities**:

1. Test a name against all sensitive patterns
2. Return array of matched categories
3. Used by both recursive analysis and primitive handling

## Sensitive Patterns

```typescript
{
  password: /password|pwd|passwd/i,
  secret: /secret|private/i,
  token: /token|jwt|bearer/i,
  apiKey: /apikey|api_key|key/i,
  credential: /credential|auth|authentication/i
}
```

**Pattern matching is case-insensitive**

## Integration Points

### Turbopack Integration

Turbopack detects boundaries and provides:

- Server component file path
- Client component file path
- Import name
- JSX location (file, line, column, span)

### Next.js Integration

In `hot-reloader-turbopack.ts`:

```typescript
import {
  analyzeBoundaries,
  formatBoundaryAnalysis,
} from '../boundary-analysis/index.js'

// Called after Turbopack provides boundary data
const analysisResult = await analyzeBoundaries(
  boundaries,
  projectPath,
  typescript
)
```

### TypeScript Compiler API Usage

**Key APIs used**:

- `typescript.createProgram()` - Create TypeScript program
- `typeChecker.getTypeAtLocation(node)` - Get type of expression
- `typeChecker.getTypeOfSymbolAtLocation()` - Get type of symbol
- `type.getProperties()` - Get object properties
- `type.getCallSignatures()` - Detect functions
- `type.flags & TypeFlags.*` - Identify type categories

## Edge Cases Handled

### 1. Spread Attributes

```typescript
<Component {...spreadProps} />
```

- Expands properties from spread type
- Analyzes each property individually

### 2. Union Types

```typescript
const apiKey = process.env.API_KEY // string | undefined
```

- Handled by TypeScript type flags (checks for both String and Undefined flags)

### 3. Nested Objects

```typescript
<Component config={{ nested: { deep: { password: "secret" } } }} />
```

- Fully recursive traversal finds password at any depth

### 4. Property Access Chains

```typescript
<Component data={user.credentials.password} />
```

- Type is `string` (primitive)
- Only checks last property "password"
- Avoids false positives from "user" or "credentials"

### 5. Functions as Props

```typescript
<Component onClick={handleClick} />
```

- Detects via `getCallSignatures()`
- Warns about non-serializable data
- Also detected when nested in objects

## Known Limitations

### 1. Dynamic Property Access

```typescript
<Component data={user[key]} />
```

- Element access expressions not currently analyzed
- TODO: Could extract string literal keys

### 2. Complex Expressions

```typescript
<Component data={condition ? obj1 : obj2} />
```

- Ternary and other complex expressions not fully analyzed
- TypeScript may infer union types

### 3. Renamed Imports

```typescript
import { User as UserType } from './types'
```

- Type resolution handles this correctly via TypeScript compiler API

## Testing Strategy

### Manual Testing

1. Clear all caches: `rm -rf .next packages/next/dist`
2. Build: `pnpm build && pnpm swc-build-native`
3. Run dev server: `pnpm next isolate/test`
4. Check output for boundary analysis

### Test Files

**isolate/test/app/page.tsx**:

```typescript
import ClientButton from './ClientButton'
import { getUser } from './util'

const Page = () => {
  const apiKey = process.env.API_KEY
  const user = getUser()

  return (
    <ClientButton
      label="Click me"
      count={42}
      z={user}
      x={apiKey}
      y={user.credentials.password}
    />
  )
}
```

**isolate/test/app/ClientButton.tsx**:

```typescript
'use client'

export default function ClientButton({ label, count }) {
  // No type annotations - tests that we analyze expression types
}
```

## Debugging

### Debug Logs

All logs prefixed with `[TYPE_RESOLVER]`:

- `Prop ${name}: ${type}` - Expression type for each prop
- `Object type - will recurse with source: ...` - Starting recursive analysis
- `Recursing into object ${path} with ${n} properties` - Entering object
- `Detected sensitive: ${path} from ${source}` - Found sensitive data
- `Primitive with identifier: ${name}` - Checking simple identifier
- `Primitive with property chain, checking last prop: ${name}` - Checking chain
- `Warning: ${path} is a function (non-serializable)` - Function detected

### Common Issues

**Issue**: Caching causes stale code to run
**Solution**: Kill all processes, clear `.next`, rebuild

**Issue**: String type treated as object
**Solution**: Use TypeScript type flags, not just `getProperties().length`

**Issue**: Missing detections in output
**Solution**: Ensure fullPath consistency between `sensitiveProps` and `sensitiveSource`

**Issue**: Duplicate detections
**Solution**: Don't analyze simple identifiers separately if they're object types

## Performance Considerations

### TypeScript Program Creation

Creating a TypeScript program is expensive:

- Parses all files in project
- Builds full type graph
- Currently done on every boundary analysis

**Potential optimization**: Cache TypeScript program between analyses

### Type Traversal Depth

Recursive traversal can be deep for complex types:

- Currently no depth limit
- May need limits for performance

**Potential optimization**: Add max depth parameter

## Future Enhancements

### 1. Value Analysis

Currently: Only analyze types and names
Future: Analyze actual runtime values when available

- Detect hardcoded secrets: `password="secret123"`
- Detect environment variables being logged

### 2. Custom Pattern Configuration

Currently: Hardcoded patterns
Future: Allow configuration via next.config.js

```typescript
experimental: {
  boundaryAnalysis: {
    sensitivePatterns: {
      custom: /mycompany.*key/i
    }
  }
}
```

### 3. Autofix Suggestions

Currently: Only warns
Future: Suggest fixes

- "Remove `password` prop"
- "Use server action instead"
- "Move to environment variable"

### 4. CI/CD Integration

Currently: Dev server only
Future: Build-time analysis

- Fail builds on sensitive data detection
- Generate report for PR reviews

## Commit History

Branch: `feat/boundary-detection-api`

1. `594be78c51` - Add API for detecting server→client component boundaries (Turbopack side)
2. `0472283894` - Add TypeScript props type analysis for boundary detection
3. `271972e350` - Add JSX prop value extraction to boundary analysis
4. `0d2eca6319` - Add recursive type analysis for nested sensitive data detection
5. `cea2f0155c` - Analyze expression types instead of component interface types
6. `f32bb648c0` - Rewrite type analyzer with expression-based analysis and source tracking (CURRENT)

## References

- [TypeScript Compiler API Docs](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [TypeScript Type Flags](https://github.com/microsoft/TypeScript/blob/main/src/compiler/types.ts)
- [Original Spec Gist](https://gist.github.com/gaojude/5d496f1f3e4130c54795b105e01f7db2)

## Appendix: Complete Example Walkthrough

### Input

```typescript
// page.tsx
const user = {
  name: "John",
  credentials: {
    password: "secret",
    apiToken: "token123"
  }
}
<ClientButton z={user} x={apiKey} y={user.credentials.password} />
```

### Processing Steps

**1. Prop `z={user}`**

- Expression: `user`
- Type: `{ name: string; credentials: { password: string; apiToken: string } }`
- Is object: YES
- Source prefix: `(z=user)`
- Recursive analysis:
  - Level 1: Properties: `name`, `credentials`
    - `name`: string → check "name" → not sensitive
    - `credentials`: object → recurse
  - Level 2 (under `credentials`): Properties: `password`, `apiToken`
    - `password`: string → check "password" → SENSITIVE ✓
      - fullPath: `z.credentials.password`
      - sourcePath: `(z=user).credentials.password`
    - `apiToken`: string → check "apiToken" → SENSITIVE (token pattern) ✓
      - fullPath: `z.credentials.apiToken`
      - sourcePath: `(z=user).credentials.apiToken`

**2. Prop `x={apiKey}`**

- Expression: `apiKey`
- Type: `string`
- Is primitive: YES
- Is identifier: YES
- Check "apiKey" → SENSITIVE (apiKey pattern) ✓
  - fullPath: `apiKey`
  - sourcePath: `x=apiKey`

**3. Prop `y={user.credentials.password}`**

- Expression: `user.credentials.password`
- Type: `string`
- Is primitive: YES
- Is property access: YES
- Extract last property: `password`
- Check "password" → SENSITIVE ✓
  - fullPath: `password`
  - sourcePath: `y=user.credentials.password`

### Output

```
⚠️  SENSITIVE DATA DETECTED:
   - PASSWORD ((z=user).credentials.password, y=user.credentials.password)
   - TOKEN ((z=user).credentials.apiToken)
   - API_KEY (x=apiKey)
```

## Developer Notes

### When Adding New Patterns

1. Add to `SensitivePatterns` interface
2. Add to `patterns` object in `resolvePropsType`
3. Add flag to `SensitiveFlags` interface
4. Add array to `SensitivePropsMap` interface
5. Update flag setting logic in `analyzePropType`
6. Update display logic in `index.ts`

### When Modifying Type Checks

- Always use TypeScript type flags for primitive detection
- Be careful with union types (may have multiple flags set)
- String types have properties (methods), don't use `getProperties()` alone

### When Debugging

1. Check console logs with `[TYPE_RESOLVER]` prefix
2. Verify fullPath values match between arrays and source map
3. Ensure sourcePrefix is passed correctly through recursion
4. Check that isPrimitive/isObject logic is mutually exclusive

---

**Last Updated**: 2025-11-29
**Status**: Implementation complete, ready for testing
**Next Steps**: User testing, potential refinements based on real-world usage
