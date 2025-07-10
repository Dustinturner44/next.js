import React, { useState } from 'react'
import { DevOverlay } from '../dev-overlay'
import { DevOverlayContext } from '../../dev-overlay.browser'
import { RenderErrorContext } from '../dev-overlay'
import { PanelContext, type PanelStateKind } from '../menu/context'
import {
  useStorybookOverlayReducer,
  storybookDefaultOverlayState,
} from './use-overlay-reducer'
import type { OverlayState } from '../shared'
import type { ReadyRuntimeError } from '../utils/get-error-by-type'
import type { Overlays } from '../components/errors/dev-tools-indicator/dev-tools-indicator'

type WrapperProps = {
  initialState?: Partial<OverlayState>
  runtimeErrors?: ReadyRuntimeError[]
  children?: never
}

export function DevOverlayStoryWrapper({
  initialState,
  runtimeErrors = [],
}: WrapperProps) {
  const mergedState: OverlayState = {
    ...storybookDefaultOverlayState,
    ...initialState,
  } as OverlayState

  const [state, dispatch] = useStorybookOverlayReducer(mergedState)
  const [panel, setPanel] = useState<null | PanelStateKind>(null)
  const [open, setOpen] = useState<null | Overlays>(null)

  const totalErrorCount = runtimeErrors.length

  return (
    <DevOverlayContext
      value={{ state, dispatch, getSquashedHydrationErrorDetails: () => null }}
    >
      <PanelContext value={{ panel, setPanel, open, setOpen }}>
        <RenderErrorContext value={{ runtimeErrors, totalErrorCount }}>
          <DevOverlay />
        </RenderErrorContext>
      </PanelContext>
    </DevOverlayContext>
  )
}
