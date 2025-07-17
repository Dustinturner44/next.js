import type { DebugInfo } from '../../../../shared/types'
import { NodejsInspectorButton } from './nodejs-inspector-button'
import { CopyErrorButton } from './copy-error-button'
import { DocsLinkButton } from './docs-link-button'
import { HammerIcon } from '../../../icons/hammer-icon'
import { useState, useCallback } from 'react'

type ErrorOverlayToolbarProps = {
  error: Error
  debugInfo: DebugInfo | undefined
  feedbackButton?: React.ReactNode
  generateErrorInfo: () => string
}

export function ErrorOverlayToolbar({
  error,
  debugInfo,
  feedbackButton,
  generateErrorInfo,
}: ErrorOverlayToolbarProps) {
  const [autoFixError, setAutoFixError] = useState<string | null>(null)

  const handleAutoFix = useCallback(async () => {
    setAutoFixError(null)

    try {
      const prompt = generateErrorInfo()
      
      if (!prompt) {
        throw new Error('Unable to generate prompt for this error')
      }

      const response = await fetch('/__nextjs_auto_fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Auto fix request failed')
      }

      const result = await response.json()
      
      if (result.success) {
        // Show fix result in console for now - in production this could be a modal/notification
        console.group('🔧 Auto Fix Result')
        console.log('Explanation:', result.explanation)
        console.log('Fix:', result.fix)
        
        if (result.appliedChanges && result.appliedChanges.length > 0) {
          console.log('Applied Changes:')
          result.appliedChanges.forEach((change: any, index: number) => {
            console.log(`${index + 1}. ${change.file}${change.line ? ` (line ${change.line})` : ''}: ${change.changes}`)
          })
          
          // Show success message for applied changes
          const changedFiles = result.appliedChanges.map((c: any) => c.file).join(', ')
          console.log(`✅ Successfully applied ${result.appliedChanges.length} change(s) to: ${changedFiles}`)
          
          // Also show an alert for immediate feedback
          console.log(`Auto Fix Applied!\n\n${result.explanation}\n\nFiles Modified: ${changedFiles}\n\nThe error should now be resolved. Check your files and refresh the page.`)
        } else {
          // No automatic changes applied, show manual instructions
          console.log('No automatic changes applied - manual intervention required')
          console.log(`Auto Fix Analysis:\n\n${result.explanation}\n\nSuggested Fix:\n${result.fix}\n\nPlease apply these changes manually.`)
        }
        
        console.groupEnd()
      } else {
        throw new Error(result.error || 'Auto fix failed')
      }
      
    } catch (error) {
      console.error('Auto fix error:', error)
      setAutoFixError(error instanceof Error ? error.message : 'Auto fix failed')
    }
  }, [generateErrorInfo])

  return (
    <span className="error-overlay-toolbar">
      {/* TODO: Move the button inside and remove the feedback on the footer of the error overlay.  */}
      {feedbackButton}
      <CopyErrorButton error={error} generateErrorInfo={generateErrorInfo} />
      <button 
        className="auto-fix-button"
        onClick={handleAutoFix}
        title={autoFixError || 'Auto Fix with AI'}
      >
        <HammerIcon style={{ color: 'var(--color-gray-900)', transform: 'rotate(-45deg)' }} />
      </button>
      {autoFixError && (
        <span className="auto-fix-error" title={autoFixError}>
          ⚠️
        </span>
      )}

      <DocsLinkButton errorMessage={error.message} />
      <NodejsInspectorButton
        devtoolsFrontendUrl={debugInfo?.devtoolsFrontendUrl}
      />
    </span>
  )
}

export const styles = `
  .error-overlay-toolbar {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .auto-fix-button {
    display: flex;
    justify-content: center;
    align-items: center;

    width: var(--size-28);
    height: var(--size-28);
    background: var(--color-background-100);
    background-clip: padding-box;
    border: 1px solid var(--color-gray-alpha-400);
    box-shadow: var(--shadow-small);
    border-radius: var(--rounded-full);

    svg {
      width: var(--size-14);
      height: var(--size-14);
    }

    &:focus {
      outline: var(--focus-ring);
    }

    &:not(:disabled):hover {
      background: var(--color-gray-alpha-100);
    }

    &:not(:disabled):active {
      background: var(--color-gray-alpha-200);
    }

    &:disabled {
      background-color: var(--color-gray-100);
      cursor: not-allowed;
    }
  }

  .auto-fix-error {
    display: flex;
    align-items: center;
    font-size: 14px;
    cursor: help;
  }

  .nodejs-inspector-button,
  .copy-error-button,
  .docs-link-button {
    display: flex;
    justify-content: center;
    align-items: center;

    width: var(--size-28);
    height: var(--size-28);
    background: var(--color-background-100);
    background-clip: padding-box;
    border: 1px solid var(--color-gray-alpha-400);
    box-shadow: var(--shadow-small);
    border-radius: var(--rounded-full);

    svg {
      width: var(--size-14);
      height: var(--size-14);
    }

    &:focus {
      outline: var(--focus-ring);
    }

    &:not(:disabled):hover {
      background: var(--color-gray-alpha-100);
    }

    &:not(:disabled):active {
      background: var(--color-gray-alpha-200);
    }

    &:disabled {
      background-color: var(--color-gray-100);
      cursor: not-allowed;
    }
  }

  .error-overlay-toolbar-button-icon {
    color: var(--color-gray-900);
  }
`
