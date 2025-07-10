import {
  ACTION_DEVTOOLS_PANEL_OPEN,
  ACTION_ERROR_OVERLAY_OPEN,
  type DispatcherEvent,
  type OverlayDispatch,
  type OverlayState,
} from './shared'

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ActionDispatch,
} from 'react'

import { ShadowPortal } from './components/shadow-portal'
import { Base } from './styles/base'
import { ComponentStyles } from './styles/component-styles'
import { CssReset } from './styles/css-reset'
import { Colors } from './styles/colors'
import { ErrorOverlay } from './components/errors/error-overlay/error-overlay'
import {
  DevToolsIndicator,
  type Overlays,
} from './components/errors/dev-tools-indicator/dev-tools-indicator'
import { RenderError } from './container/runtime-error/render-error'
import { DarkTheme } from './styles/dark-theme'
import { useDevToolsScale } from './components/errors/dev-tools-indicator/dev-tools-info/preferences'
import type { HydrationErrorState } from '../shared/hydration-error'
import { DevToolsIndicatorNew as DevToolsIndicatorNew } from './components/devtools-indicator/devtools-indicator'
import { DevToolsPanel } from './components/devtools-panel/devtools-panel'
import type { ReadyRuntimeError } from './utils/get-error-by-type'
import { useDevOverlayContext } from '../dev-overlay.browser'
import { PanelRouter } from './menu/panel-router'
import { PanelContext, type PanelStateKind } from './menu/context'

export const RenderErrorContext = createContext<{
  runtimeErrors: ReadyRuntimeError[]
  totalErrorCount: number
}>(null!)

export const useRenderErrorContext = () => useContext(RenderErrorContext)

export function DevOverlay() {
  const { dispatch, state } = useDevOverlayContext()
  const [scale, setScale] = useDevToolsScale()
  const [isPrevBuildError, setIsPrevBuildError] = useState(false)

  const isBuildError = state.buildError !== null

  if (
    process.env.__NEXT_DEVTOOL_NEW_PANEL_UI &&
    isBuildError !== isPrevBuildError
  ) {
    // If the build error is set, enable the devtools panel as the error overlay mode,
    // and the rest actions (close, minimize, fullscreen) can be handled by the user.
    if (isBuildError) {
      dispatch({ type: ACTION_DEVTOOLS_PANEL_OPEN })
      dispatch({ type: ACTION_ERROR_OVERLAY_OPEN })
    }
    setIsPrevBuildError(isBuildError)
  }
  // stupid state same thing
  const [panel, setPanel] = useState<PanelStateKind | null>(null)
  const [open, setOpen] = useState<Overlays | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  // // @ts-expect-error
  // process.env.__NEXT_DEVTOOL_NEW_PANEL_UI = true
  return (
    <ShadowPortal>
      <CssReset />
      <Base
        scale={process.env.__NEXT_DEVTOOL_NEW_PANEL_UI ? state.scale : scale}
      />
      <Colors />
      <ComponentStyles />
      <DarkTheme />

      {/* todo: render error should provide this context, probably shouldn't have render props at all tbh */}
      <RenderError state={state} dispatch={dispatch} isAppDir={true}>
        {({ runtimeErrors, totalErrorCount }) => {
          return (
            <PanelContext
              value={{
                triggerRef,
                panel,
                setPanel,
                open,
                setOpen,
              }}
            >
              <RenderErrorContext value={{ runtimeErrors, totalErrorCount }}>
                {state.showIndicator &&
                  (process.env.__NEXT_DEVTOOL_NEW_PANEL_UI ? (
                    <>
                      <PanelRouter />
                      <DevToolsIndicatorNew />
                    </>
                  ) : (
                    <>
                      <DevToolsIndicator scale={scale} setScale={setScale} />
                      <ErrorOverlay />
                    </>
                  ))}
              </RenderErrorContext>
            </PanelContext>
          )
        }}
      </RenderError>
    </ShadowPortal>
  )
}
