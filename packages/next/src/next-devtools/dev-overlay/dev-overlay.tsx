import { createContext, useContext, useRef, useState } from 'react'
import { ShadowPortal } from './components/shadow-portal'
import { Base } from './styles/base'
import { ComponentStyles } from './styles/component-styles'
import { CssReset } from './styles/css-reset'
import { Colors } from './styles/colors'
import { ErrorOverlay } from './components/errors/error-overlay/error-overlay'
import { DevToolsIndicator } from './components/errors/dev-tools-indicator/dev-tools-indicator'
import { RenderError } from './container/runtime-error/render-error'
import { DarkTheme } from './styles/dark-theme'
import { useDevToolsScale } from './components/errors/dev-tools-indicator/dev-tools-info/preferences'
import type { HydrationErrorState } from '../shared/hydration-error'
import type { ReadyRuntimeError } from './utils/get-error-by-type'
import { DevToolsIndicatorNew } from './components/devtools-indicator/devtools-indicator'
import { PanelRouter } from './menu/panel-router'
import { PanelRouterContext, type PanelStateKind } from './menu/context'
import type { OverlayState, OverlayDispatch } from './shared'
import { Dev0Provider } from './context/dev-zero-context'
import { SidebarProvider } from './context/sidebar-context'
import { DevSidebar } from './components/sidebar/dev-sidebar'

export const RenderErrorContext = createContext<{
  runtimeErrors: ReadyRuntimeError[]
  totalErrorCount: number
}>(null!)

export const useRenderErrorContext = () => useContext(RenderErrorContext)

export function DevOverlay({
  state,
  dispatch,
  getSquashedHydrationErrorDetails,
}: {
  state: OverlayState
  dispatch: OverlayDispatch
  getSquashedHydrationErrorDetails: (error: Error) => HydrationErrorState | null
}) {
  const [scale, setScale] = useDevToolsScale()
  const [panels, setPanels] = useState<Set<PanelStateKind>>(new Set())
  const isBuildError = state.buildError !== null
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const triggerRef = useRef<HTMLButtonElement>(null)

  const openPanel = (panel: PanelStateKind) => {
    setPanels((prev) => new Set([...prev, panel]))
  }

  const closePanel = (panel: PanelStateKind) => {
    setPanels((prev) => {
      const next = new Set(prev)
      next.delete(panel)
      return next
    })
  }

  const togglePanel = (panel: PanelStateKind) => {
    setPanels((prev) => {
      const next = new Set(prev)
      if (next.has(panel)) {
        next.delete(panel)
      } else {
        next.add(panel)
      }
      return next
    })
  }

  const closeAllPanels = () => {
    setPanels(new Set())
  }
  return (
    <ShadowPortal>
      <CssReset />
      <Base
        scale={process.env.__NEXT_DEVTOOL_NEW_PANEL_UI ? state.scale : scale}
      />
      <Colors />
      <ComponentStyles />
      <DarkTheme />

      <RenderError state={state} dispatch={dispatch} isAppDir={true}>
        {({ runtimeErrors, totalErrorCount }) => {
          return (
            <>
              {state.showIndicator &&
              process.env.__NEXT_DEVTOOL_NEW_PANEL_UI ? (
                <>
                  <RenderErrorContext
                    value={{ runtimeErrors, totalErrorCount }}
                  >
                    <Dev0Provider>
                      <SidebarProvider>
                        <PanelRouterContext
                          value={{
                            panels,
                            setPanels,
                            openPanel,
                            closePanel,
                            togglePanel,
                            closeAllPanels,
                            triggerRef,
                            selectedIndex,
                            setSelectedIndex,
                          }}
                        >
                          <ErrorOverlay
                            state={state}
                            dispatch={dispatch}
                            getSquashedHydrationErrorDetails={
                              getSquashedHydrationErrorDetails
                            }
                            runtimeErrors={runtimeErrors}
                            errorCount={totalErrorCount}
                          />
                          <PanelRouter />
                          <DevToolsIndicatorNew />
                          <DevSidebar />
                        </PanelRouterContext>
                      </SidebarProvider>
                    </Dev0Provider>
                  </RenderErrorContext>
                </>
              ) : (
                <>
                  <DevToolsIndicator
                    scale={scale}
                    setScale={setScale}
                    state={state}
                    dispatch={dispatch}
                    errorCount={totalErrorCount}
                    isBuildError={isBuildError}
                  />

                  <ErrorOverlay
                    state={state}
                    dispatch={dispatch}
                    getSquashedHydrationErrorDetails={
                      getSquashedHydrationErrorDetails
                    }
                    runtimeErrors={runtimeErrors}
                    errorCount={totalErrorCount}
                  />
                </>
              )}
            </>
          )
        }}
      </RenderError>
    </ShadowPortal>
  )
}
