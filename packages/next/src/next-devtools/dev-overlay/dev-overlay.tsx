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
import { PanelDock } from './components/dock/panel-dock'

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

  // Docking system state
  const [activePanel, setActivePanel] = useState<PanelStateKind | null>(null)
  const [dockedPanels, setDockedPanels] = useState<Set<PanelStateKind>>(
    new Set()
  )

  const triggerRef = useRef<HTMLButtonElement>(null)

  const openPanel = (panel: PanelStateKind) => {
    // If there's already an active panel, dock it
    if (
      activePanel &&
      activePanel !== panel &&
      activePanel !== 'panel-selector'
    ) {
      setDockedPanels((prev) => new Set([...prev, activePanel]))
    }

    // Set the new panel as active
    setActivePanel(panel)
    setPanels((prev) => new Set([...prev, panel]))
    bringPanelToFront(panel)
  }

  const closePanel = (panel: PanelStateKind) => {
    setPanels((prev) => {
      const next = new Set(prev)
      next.delete(panel)
      return next
    })
    setPanelZOrder((prev) => prev.filter((p) => p !== panel))

    // Remove from dock if it's there
    setDockedPanels((prev) => {
      const next = new Set(prev)
      next.delete(panel)
      return next
    })

    // Clear active panel if it's the one being closed
    if (activePanel === panel) {
      setActivePanel(null)
    }
  }

  const togglePanel = (panel: PanelStateKind) => {
    setPanels((prev) => {
      const next = new Set(prev)
      if (next.has(panel)) {
        next.delete(panel)
        setPanelZOrder((prevZ) => prevZ.filter((p) => p !== panel))

        // Remove from dock
        setDockedPanels((prevDocked) => {
          const nextDocked = new Set(prevDocked)
          nextDocked.delete(panel)
          return nextDocked
        })

        // Clear active panel
        if (activePanel === panel) {
          setActivePanel(null)
        }
      } else {
        // Open panel with docking logic
        if (
          activePanel &&
          activePanel !== panel &&
          activePanel !== 'panel-selector'
        ) {
          setDockedPanels((prevDocked) => new Set([...prevDocked, activePanel]))
        }
        setActivePanel(panel)
        next.add(panel)
        bringPanelToFront(panel)
      }
      return next
    })
  }

  const closeAllPanels = () => {
    setPanels(new Set())
    setPanelZOrder([])
    setActivePanel(null)
    setDockedPanels(new Set())
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

  const dockPanel = useCallback(
    (panel: PanelStateKind) => {
      if (panel !== 'panel-selector') {
        setDockedPanels((prev) => new Set([...prev, panel]))
        if (activePanel === panel) {
          setActivePanel(null)
        }
      }
    },
    [activePanel]
  )

  const swapPanels = useCallback(
    (panel: PanelStateKind) => {
      // If clicking a docked panel, swap it with the active one
      if (dockedPanels.has(panel)) {
        if (activePanel && activePanel !== 'panel-selector') {
          // Swap with currently active
          setDockedPanels((prev) => {
            const dockedArray = Array.from(prev)
            const clickedIndex = dockedArray.indexOf(panel)
            if (clickedIndex !== -1) {
              dockedArray[clickedIndex] = activePanel
            }
            return new Set(dockedArray)
          })
        } else {
          // No active panel – delay removal so animation starts from correct position
          setTimeout(() => {
            setDockedPanels((prev) => {
              const next = new Set(prev)
              next.delete(panel)
              return next
            })
          }, 400) // Match panel animation duration (0.4s)
        }
        // Make clicked panel active
        setActivePanel(panel)
        bringPanelToFront(panel)
      }
    },
    [activePanel, dockedPanels, bringPanelToFront]
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
                            dockedPanels,
                            setActivePanel,
                            dockPanel,
                            swapPanels,
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
                          <PanelDock
                            dockedPanels={dockedPanels}
                            activePanel={activePanel}
                            onPanelClick={() => {}}
                          />
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
