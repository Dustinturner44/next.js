import type { DevToolsPanelTabType } from '../devtools-panel'
import type { Corners, OverlayState } from '../../../shared'
import type { DebugInfo } from '../../../../shared/types'
import type { ReadyRuntimeError } from '../../../utils/get-error-by-type'
import type { HydrationErrorState } from '../../../../shared/hydration-error'

import { SettingsTab } from './settings-tab'
import { IssuesTab } from './issues-tab/issues-tab'

export function DevToolsPanelTab({
  activeTab,
  runtimeErrors,
  devToolsPosition,
  scale,
  debugInfo,
  buildError,
  handlePositionChange,
  handleScaleChange,
  getSquashedHydrationErrorDetails,
}: {
  activeTab: DevToolsPanelTabType
  runtimeErrors: ReadyRuntimeError[]
  devToolsPosition: Corners
  scale: number
  debugInfo: DebugInfo
  buildError: OverlayState['buildError']
  handlePositionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  handleScaleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  getSquashedHydrationErrorDetails: (error: Error) => HydrationErrorState | null
}) {
  switch (activeTab) {
    case 'settings':
      return (
        <SettingsTab
          devToolsPosition={devToolsPosition}
          scale={scale}
          handlePositionChange={handlePositionChange}
          handleScaleChange={handleScaleChange}
        />
      )
    case 'route':
      return <div>Route</div>
    case 'issues':
      return (
        <IssuesTab
          debugInfo={debugInfo}
          buildError={buildError}
          runtimeErrors={runtimeErrors}
          getSquashedHydrationErrorDetails={getSquashedHydrationErrorDetails}
        />
      )
    default:
      return null
  }
}
