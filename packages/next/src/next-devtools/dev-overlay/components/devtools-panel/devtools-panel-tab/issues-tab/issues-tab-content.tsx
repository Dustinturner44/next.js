import type { ReadyRuntimeError } from '../../../../utils/get-error-by-type'
import type { OverlayState } from '../../../../shared'

import { Suspense, useMemo, useState } from 'react'

import { Terminal } from '../../../terminal'
import { HotlinkedText } from '../../../hot-linked-text'
import { PseudoHtmlDiff } from '../../../../container/runtime-error/component-stack-pseudo-html'
import { useFrames } from '../../../../utils/get-error-by-type'
import { CodeFrame } from '../../../code-frame/code-frame'
import { CallStack } from '../../../call-stack/call-stack'
import { NEXTJS_HYDRATION_ERROR_LINK } from '../../../../../shared/react-19-hydration-error'
import { css } from '../../../../utils/css'

export function IssuesTabContent({
  notes,
  buildError,
  hydrationWarning,
  errorDetails,
  activeError,
}: {
  notes: string | null
  buildError: OverlayState['buildError']
  hydrationWarning: string | null
  errorDetails: {
    hydrationWarning: string | null
    notes: string | null
    reactOutputComponentDiff: string | null
  }
  activeError: ReadyRuntimeError
}) {
  if (buildError) {
    return <Terminal content={buildError} />
  }

  return (
    <>
      <div className="error-overlay-notes-container">
        {notes ? (
          <>
            <p
              id="nextjs__container_errors__notes"
              className="nextjs__container_errors__notes"
            >
              {notes}
            </p>
          </>
        ) : null}
        {hydrationWarning ? (
          <p
            id="nextjs__container_errors__link"
            className="nextjs__container_errors__link"
          >
            <HotlinkedText
              text={`See more info here: ${NEXTJS_HYDRATION_ERROR_LINK}`}
            />
          </p>
        ) : null}
      </div>
      {errorDetails.reactOutputComponentDiff ? (
        <PseudoHtmlDiff
          reactOutputComponentDiff={errorDetails.reactOutputComponentDiff || ''}
        />
      ) : null}
      <Suspense fallback={<div data-nextjs-error-suspended />}>
        <RuntimeError key={activeError.id.toString()} error={activeError} />
      </Suspense>
    </>
  )
}

function RuntimeError({ error }: { error: ReadyRuntimeError }) {
  const [isIgnoreListOpen, setIsIgnoreListOpen] = useState(false)
  const frames = useFrames(error)

  const ignoredFramesTally = useMemo(() => {
    return frames.reduce((tally, frame) => tally + (frame.ignored ? 1 : 0), 0)
  }, [frames])

  const firstFrame = useMemo(() => {
    const firstFirstPartyFrameIndex = frames.findIndex(
      (entry) =>
        !entry.ignored &&
        Boolean(entry.originalCodeFrame) &&
        Boolean(entry.originalStackFrame)
    )

    return frames[firstFirstPartyFrameIndex] ?? null
  }, [frames])

  if (!firstFrame.originalStackFrame) {
    return null
  }

  if (!firstFrame.originalCodeFrame) {
    return null
  }

  return (
    <>
      {firstFrame && (
        <CodeFrame
          stackFrame={firstFrame.originalStackFrame}
          codeFrame={firstFrame.originalCodeFrame}
        />
      )}

      {frames.length > 0 && (
        <CallStack
          frames={frames}
          isIgnoreListOpen={isIgnoreListOpen}
          onToggleIgnoreList={() => setIsIgnoreListOpen(!isIgnoreListOpen)}
          ignoredFramesTally={ignoredFramesTally}
        />
      )}
    </>
  )
}

export const DEVTOOLS_PANEL_TAB_ISSUES_CONTENT_STYLES = css`
  [data-nextjs-devtools-panel-tab-issues-content] {
    width: 100%;
    padding: 14px;
  }

  /* errors/dialog/header.tsx */
  .nextjs-container-errors-header {
    position: relative;
  }
  .nextjs-container-errors-header > h1 {
    font-size: var(--size-20);
    line-height: var(--size-24);
    font-weight: bold;
    margin: calc(16px * 1.5) 0;
    color: var(--color-title-h1);
  }
  .nextjs-container-errors-header small {
    font-size: var(--size-14);
    color: var(--color-accents-1);
    margin-left: 16px;
  }
  .nextjs-container-errors-header small > span {
    font-family: var(--font-stack-monospace);
  }
  .nextjs-container-errors-header > div > small {
    margin: 0;
    margin-top: 4px;
  }
  .nextjs-container-errors-header > p > a {
    color: inherit;
    font-weight: bold;
  }
  .nextjs-container-errors-header
    > .nextjs-container-build-error-version-status {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  /* errors.tsx */
  .nextjs-error-with-static {
    bottom: calc(16px * 4.5);
  }
  p.nextjs__container_errors__link {
    font-size: var(--size-14);
  }
  p.nextjs__container_errors__notes {
    color: var(--color-stack-notes);
    font-size: var(--size-14);
    line-height: 1.5;
  }
  .nextjs-container-errors-body > h2:not(:first-child) {
    margin-top: calc(16px + 8px);
  }
  .nextjs-container-errors-body > h2 {
    color: var(--color-title-color);
    margin-bottom: 8px;
    font-size: var(--size-20);
  }
  .nextjs-toast-errors-parent {
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .nextjs-toast-errors-parent:hover {
    transform: scale(1.1);
  }
  .nextjs-toast-errors {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .nextjs-toast-errors > svg {
    margin-right: 8px;
  }
  .nextjs-toast-hide-button {
    margin-left: 24px;
    border: none;
    background: none;
    color: var(--color-ansi-bright-white);
    padding: 0;
    transition: opacity 0.25s ease;
    opacity: 0.7;
  }
  .nextjs-toast-hide-button:hover {
    opacity: 1;
  }
  .nextjs__container_errors__error_title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .error-overlay-notes-container {
    margin: 8px 2px;
  }
  .error-overlay-notes-container p {
    white-space: pre-wrap;
  }
`
