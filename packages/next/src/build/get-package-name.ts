export function getPackageName(filePath: string): string | null {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/')

  // Find the last occurrence of node_modules to handle nested cases
  const nodeModulesIndex = normalizedPath.lastIndexOf('node_modules/')
  if (nodeModulesIndex === -1) {
    return null
  }

  // Get the path after the last node_modules/
  const afterNodeModules = normalizedPath.substring(
    nodeModulesIndex + 'node_modules/'.length
  )

  // Handle pnpm .pnpm directory structure
  // Example: .pnpm/react@18.0.0/node_modules/react/index.js
  // Example: .pnpm/@babel+core@7.0.0/node_modules/@babel/core/lib/index.js
  if (afterNodeModules.startsWith('.pnpm/')) {
    // Find the nested node_modules within .pnpm structure
    const nestedNodeModulesIndex = afterNodeModules.indexOf('/node_modules/')
    if (nestedNodeModulesIndex !== -1) {
      const afterNestedNodeModules = afterNodeModules.substring(
        nestedNodeModulesIndex + '/node_modules/'.length
      )
      return extractPackageNameFromPath(afterNestedNodeModules)
    }
    // Fallback: try to extract from .pnpm path directly
    const pnpmPath = afterNodeModules.substring('.pnpm/'.length)
    const firstSlash = pnpmPath.indexOf('/')
    if (firstSlash !== -1) {
      const packageSpec = pnpmPath.substring(0, firstSlash)
      // Handle scoped packages like @babel+core@7.0.0 → @babel/core
      return packageSpec.replace(/\+/g, '/').replace(/@[^@]*$/, '')
    }
  }

  // Handle regular npm/yarn structure
  return extractPackageNameFromPath(afterNodeModules)
}

function extractPackageNameFromPath(path: string): string | null {
  if (!path) return null

  const parts = path.split('/')
  const packagePart = parts[0]

  // Return null for empty or special directory names
  if (!packagePart || packagePart.startsWith('.')) {
    return null
  }

  // Handle scoped packages (start with @)
  if (packagePart.startsWith('@')) {
    if (parts.length < 2 || !parts[1]) return null
    return `${parts[0]}/${parts[1]}`
  }

  // Handle regular packages
  return packagePart
}
