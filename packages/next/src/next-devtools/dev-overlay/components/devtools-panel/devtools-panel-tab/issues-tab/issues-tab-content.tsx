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
      {/* TODO: Loading state */}
      <Suspense fallback={<div data-nextjs-error-suspended />}>
        <RuntimeError key={activeError.id.toString()} error={activeError} />
      </Suspense>
    </>
  )
}

/* Ported the content from container/runtime-error/index.tsx */
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

  return (
    <>
      {firstFrame && (
        <CodeFrame
          stackFrame={firstFrame.originalStackFrame!}
          codeFrame={firstFrame.originalCodeFrame!}
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

/* Shares the style with container/errors.tsx and errors/dialog/header.tsx */
export const DEVTOOLS_PANEL_TAB_ISSUES_CONTENT_STYLES = css`
  [data-nextjs-devtools-panel-tab-issues-content] {
    width: 100%;
    padding: 14px;
  }
`
