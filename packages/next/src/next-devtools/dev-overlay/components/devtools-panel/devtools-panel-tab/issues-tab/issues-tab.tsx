import type { OverlayState } from '../../../../shared'
import type { DebugInfo } from '../../../../../shared/types'
import type { ReadyRuntimeError } from '../../../../utils/get-error-by-type'
import type { HydrationErrorState } from '../../../../../shared/hydration-error'

import { IssuesTabContent } from './issues-tab-content'
import { IssuesTabSidebar } from './issues-tab-sidebar'
import {
  GenericErrorDescription,
  HydrationErrorDescription,
} from '../../../../container/errors'
import { EnvironmentNameLabel } from '../../../errors/environment-name-label/environment-name-label'
import { ErrorMessage } from '../../../errors/error-message/error-message'
import { ErrorOverlayToolbar } from '../../../errors/error-overlay-toolbar/error-overlay-toolbar'
import { ErrorTypeLabel } from '../../../errors/error-type-label/error-type-label'
import { css } from '../../../../utils/css'
import { useActiveRuntimeError } from '../../../../hooks/use-active-runtime-error'

export function IssuesTab({
  debugInfo,
  buildError,
  runtimeErrors,
  getSquashedHydrationErrorDetails,
}: {
  debugInfo: DebugInfo
  buildError: OverlayState['buildError']
  runtimeErrors: ReadyRuntimeError[]
  getSquashedHydrationErrorDetails: (error: Error) => HydrationErrorState | null
}) {
  const {
    isLoading,
    errorCode,
    errorType,
    notes,
    hydrationWarning,
    activeIdx,
    errorDetails,
    activeError,
    setActiveIndex,
  } = useActiveRuntimeError({ runtimeErrors, getSquashedHydrationErrorDetails })

  if (isLoading) {
    // TODO: better loading state
    return null
  }

  if (!activeError) {
    return null
  }

  const errorMessage = hydrationWarning ? (
    <HydrationErrorDescription message={hydrationWarning} />
  ) : (
    <GenericErrorDescription error={activeError.error} />
  )

  return (
    <div data-nextjs-devtools-panel-tab-issues>
      <IssuesTabSidebar
        runtimeErrors={runtimeErrors}
        errorType={errorType}
        activeIdx={activeIdx}
        setActiveIndex={setActiveIndex}
      />
      <div data-nextjs-devtools-panel-tab-issues-content>
        <div className="nextjs-container-errors-header">
          <div
            className="nextjs__container_errors__error_title"
            // allow assertion in tests before error rating is implemented
            data-nextjs-error-code={errorCode}
          >
            <span data-nextjs-error-label-group>
              <ErrorTypeLabel errorType={errorType} />
              {activeError.error.environmentName && (
                <EnvironmentNameLabel
                  environmentName={activeError.error.environmentName}
                />
              )}
            </span>
            <ErrorOverlayToolbar
              error={activeError.error}
              debugInfo={debugInfo}
            />
          </div>
          <ErrorMessage errorMessage={errorMessage} />
        </div>

        <IssuesTabContent
          buildError={buildError}
          notes={notes}
          hydrationWarning={hydrationWarning}
          errorDetails={errorDetails}
          activeError={activeError}
        />
      </div>
    </div>
  )
}

export const DEVTOOLS_PANEL_TAB_ISSUES_STYLES = css`
  [data-nextjs-devtools-panel-tab-issues] {
    display: flex;
  }
`
