import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from 'react'
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
  const [panelZOrder, setPanelZOrder] = useState<string[]>([])

  // Single active panel state
  const [activePanel, setActivePanel] = useState<PanelStateKind | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)

  const openPanel = (panel: PanelStateKind) => {
    // Close other panels except panel-selector and hub
    if (panel !== 'panel-selector' && panel !== 'hub') {
      setPanels((prev) => {
        const next = new Set()
        // Keep panel-selector and hub if they were open
        if (prev.has('panel-selector')) next.add('panel-selector')
        if (prev.has('hub')) next.add('hub')
        next.add(panel)
        return next
      })
    } else {
      setPanels((prev) => new Set([...prev, panel]))
    }
    
    setActivePanel(panel)
    bringPanelToFront(panel)
  }

  const closePanel = (panel: PanelStateKind) => {
    setPanels((prev) => {
      const next = new Set(prev)
      next.delete(panel)
      return next
    })
    setPanelZOrder((prev) => prev.filter((p) => p !== panel))

    // Clear active panel if it's the one being closed
    if (activePanel === panel) {
      setActivePanel(null)
    }
  }

  const togglePanel = (panel: PanelStateKind) => {
    if (panels.has(panel)) {
      closePanel(panel)
    } else {
      openPanel(panel)
    }
  }

  const closeAllPanels = () => {
    setPanels(new Set())
    setPanelZOrder([])
    setActivePanel(null)
  }

  const bringPanelToFront = useCallback((panel: string) => {
    setPanelZOrder((prev) => {
      const filtered = prev.filter((p) => p !== panel)
      return [...filtered, panel]
    })
  }, [])

  const getPanelZIndex = useCallback(
    (panel: string) => {
      const baseZIndex = 2147483646
      const index = panelZOrder.indexOf(panel)
      return index === -1 ? baseZIndex : baseZIndex + index + 1
    },
    [panelZOrder]
  )

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
                            bringPanelToFront,
                            getPanelZIndex,
                            activePanel,
                            setActivePanel,
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
