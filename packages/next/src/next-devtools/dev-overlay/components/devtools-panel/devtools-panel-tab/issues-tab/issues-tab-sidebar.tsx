import type { ReadyRuntimeError } from '../../../../utils/get-error-by-type'

import { Suspense, useMemo } from 'react'

import { css } from '../../../../utils/css'
import { getFrameSource } from '../../../../../shared/stack-frame'
import { useFrames } from '../../../../utils/get-error-by-type'

export function IssuesTabSidebar({
  runtimeErrors,
  errorType,
  activeIdx,
  setActiveIndex,
}: {
  runtimeErrors: ReadyRuntimeError[]
  errorType: string | null
  activeIdx: number
  setActiveIndex: (idx: number) => void
}) {
  return (
    <aside data-nextjs-devtools-panel-tab-issues-sidebar>
      {runtimeErrors.map((runtimeError, idx) => {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <IssuesTabSidebarFrame
              key={idx}
              runtimeError={runtimeError}
              errorType={errorType}
              idx={idx}
              activeIdx={activeIdx}
              setActiveIndex={setActiveIndex}
            />
          </Suspense>
        )
      })}
    </aside>
  )
}

function IssuesTabSidebarFrame({
  runtimeError,
  errorType,
  idx,
  activeIdx,
  setActiveIndex,
}: {
  runtimeError: ReadyRuntimeError
  errorType: string | null
  idx: number
  activeIdx: number
  setActiveIndex: (idx: number) => void
}) {
  const frames = useFrames(runtimeError)

  const firstFrame = useMemo(() => {
    const firstFirstPartyFrameIndex = frames.findIndex(
      (entry) =>
        !entry.ignored &&
        Boolean(entry.originalCodeFrame) &&
        Boolean(entry.originalStackFrame)
    )

    return frames[firstFirstPartyFrameIndex] ?? null
  }, [frames])

  const frameSource = getFrameSource(firstFrame.originalStackFrame!)
  return (
    <button
      data-nextjs-devtools-panel-tab-issues-sidebar-frame
      data-nextjs-devtools-panel-tab-issues-sidebar-frame-active={
        idx === activeIdx
      }
      onClick={() => setActiveIndex(idx)}
    >
      <span data-nextjs-devtools-panel-tab-issues-sidebar-frame-error-type>
        {errorType}
      </span>
      <span data-nextjs-devtools-panel-tab-issues-sidebar-frame-source>
        {frameSource}
      </span>
    </button>
  )
}

export const DEVTOOLS_PANEL_TAB_ISSUES_SIDEBAR_STYLES = css`
  [data-nextjs-devtools-panel-tab-issues-sidebar] {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border-right: 1px solid var(--color-gray-400);

    min-width: 128px;

    @media (min-width: 576px) {
      max-width: 138px;
      width: 100%;
    }

    @media (min-width: 768px) {
      max-width: 172.5px;
      width: 100%;
    }

    @media (min-width: 992px) {
      max-width: 230px;
      width: 100%;
    }
  }

  [data-nextjs-devtools-panel-tab-issues-sidebar-frame] {
    display: flex;
    flex-direction: column;
    padding: 10px 8px;
    border-radius: var(--rounded-lg);
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: var(--color-gray-200);
    }

    &:active {
      background-color: var(--color-gray-300);
    }
  }

  [data-nextjs-devtools-panel-tab-issues-sidebar-frame-active='true'] {
    background-color: var(--color-gray-100);
  }

  [data-nextjs-devtools-panel-tab-issues-sidebar-frame-error-type] {
    display: inline-block;
    align-self: flex-start;
    color: var(--color-gray-1000);
    font-size: var(--size-14);
    font-weight: 500;
    line-height: var(--size-20);
  }

  [data-nextjs-devtools-panel-tab-issues-sidebar-frame-source] {
    display: inline-block;
    align-self: flex-start;
    color: var(--color-gray-900);
    font-size: var(--size-13);
    line-height: var(--size-18);
  }
`
