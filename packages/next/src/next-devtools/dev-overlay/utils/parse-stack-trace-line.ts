export function parseStackTraceLine(
  line: string
): {
  component: string
  file: string
  lineNumber: number
  column: number
} {
  // Chrome: "    at Component (file.js:10:15)"
  // Safari: "Component@file.js:10:15"
  const chromeMatch = line.match(
    /^(?:at )?(.+?) \((.+?):(\d+):(\d+)\)$/
  )
  if (chromeMatch) {
    const [, component, file, lineNumber, column] = chromeMatch
    return {
      component,
      file,
      lineNumber: Number(lineNumber),
      column: Number(column),
    }
  }

  const safariMatch = line.match(
    /^(.+?)@(.+?):(\d+):(\d+)$/
  )
  if (safariMatch) {
    const [, component, file, lineNumber, column] = safariMatch
    return {
      component,
      file,
      lineNumber: Number(lineNumber),
      column: Number(column),
    }
  }
  return {
    component: line.trim(),
    // If no match, return the line as the component
    // and leave file, lineNumber, and column undefined
    file: 'unknown',
    lineNumber: 0,
    column: 0,
  }
}