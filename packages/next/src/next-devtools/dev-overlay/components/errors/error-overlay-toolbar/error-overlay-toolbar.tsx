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
  const [isFixing, setIsFixing] = useState(false)

  const handleAutoFix = useCallback(async () => {
    if (isFixing) return
    
    setAutoFixError(null)
    setIsFixing(true)

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
    } finally {
      setIsFixing(false)
    }
  }, [generateErrorInfo, isFixing])

  return (
    <span className="error-overlay-toolbar">
      {/* TODO: Move the button inside and remove the feedback on the footer of the error overlay.  */}
      {feedbackButton}
      <button 
        className={`auto-fix-button ${isFixing ? 'fixing' : ''}`}
        onClick={handleAutoFix}
        disabled={isFixing}
        title={autoFixError || (isFixing ? 'Fixing...' : 'Auto Fix with AI')}
      >
        <HammerIcon 
          className={isFixing ? 'hammer-hitting' : ''}
          style={{ color: 'var(--color-gray-900)', transform: 'rotate(-45deg)' }} 
        />
      </button>
      {autoFixError && (
        <span className="auto-fix-error" title={autoFixError}>
          ⚠️
        </span>
      )}

      <CopyErrorButton error={error} generateErrorInfo={generateErrorInfo} />
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
    position: relative;

    width: var(--size-28);
    height: var(--size-28);
    background: var(--color-background-100);
    background-clip: padding-box;
    border: 1px solid var(--color-gray-alpha-400);
    box-shadow: var(--shadow-small);
    border-radius: var(--rounded-full);
    transition: all 0.2s ease;

    svg {
      width: var(--size-14);
      height: var(--size-14);
      transition: transform 0.1s ease;
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
      opacity: 0.7;
    }

    &.fixing {
      border-color: #3b82f6;
      animation: loading-pulse 2s infinite;
      
      &::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: var(--rounded-full);
        background: conic-gradient(from 0deg, #3b82f6, #60a5fa, #3b82f6);
        animation: loading-spin 1.5s linear infinite;
        z-index: -1;
      }
      
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: var(--rounded-full);
        background: var(--color-background-100);
        z-index: -1;
      }
    }
  }

  .hammer-hitting {
    animation: hammer-hit 0.6s ease-out infinite;
  }

  @keyframes hammer-hit {
    0% { 
      transform: rotate(-45deg); 
    }
    30% { 
      transform: rotate(-75deg); 
    }
    60% { 
      transform: rotate(-45deg); 
    }
    100% { 
      transform: rotate(-45deg); 
    }
  }

  @keyframes loading-spin {
    0% { 
      transform: rotate(0deg); 
    }
    100% { 
      transform: rotate(360deg); 
    }
  }

  @keyframes loading-pulse {
    0%, 100% { 
      box-shadow: var(--shadow-small), 0 0 0 0 rgba(59, 130, 246, 0.4); 
    }
    50% { 
      box-shadow: var(--shadow-small), 0 0 0 4px rgba(59, 130, 246, 0.1); 
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
