import { CopyButton } from '../../copy-button'

export function CopyStackTraceButton({
  error,
  generateAIPrompt,
}: {
  error: Error
  generateAIPrompt?: () => string
}) {
  const generateContent = () => {
    if (generateAIPrompt) {
      try {
        return generateAIPrompt()
      } catch (e) {
        console.warn(
          'Failed to generate AI prompt, falling back to stack trace:',
          e
        )
        return error.stack || ''
      }
    }
    // Fallback to original stack trace if no generator is provided
    return error.stack || ''
  }

  return (
    <CopyButton
      data-nextjs-data-runtime-error-copy-stack
      className="copy-stack-trace-button"
      actionLabel={
        generateAIPrompt ? 'Copy AI Debug Prompt' : 'Copy Stack Trace'
      }
      successLabel={
        generateAIPrompt ? 'AI Debug Prompt Copied' : 'Stack Trace Copied'
      }
      content={generateContent()}
      disabled={!error}
    />
  )
}
