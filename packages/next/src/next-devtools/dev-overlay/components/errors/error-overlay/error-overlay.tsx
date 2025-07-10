import {
  ACTION_ERROR_OVERLAY_CLOSE,
  type OverlayDispatch,
  type OverlayState,
} from '../../../shared'

import { Suspense } from 'react'
import { BuildError } from '../../../container/build-error'
import { Errors } from '../../../container/errors'
import { useDelayedRender } from '../../../hooks/use-delayed-render'
import type { ReadyRuntimeError } from '../../../utils/get-error-by-type'
import type { HydrationErrorState } from '../../../../shared/hydration-error'
import { useDevOverlayContext } from '../../../../dev-overlay.browser'
import { useRenderErrorContext } from '../../../dev-overlay'

const transitionDurationMs = 200

export interface ErrorBaseProps {
  rendered: boolean
  transitionDurationMs: number
}

export function ErrorOverlay() {
  const { state } = useDevOverlayContext()
  const { runtimeErrors } = useRenderErrorContext()

  // This hook lets us do an exit animation before unmounting the component
  const { mounted, rendered } = useDelayedRender(state.isErrorOverlayOpen, {
    exitDelay: transitionDurationMs,
  })

  if (state.buildError !== null) {
    return (
      <BuildError
        transitionDurationMs={transitionDurationMs}
        message={state.buildError}
        // This is not a runtime error, forcedly display error overlay
        rendered
      />
    )
  }

  // No Runtime Errors.
  if (!runtimeErrors.length) {
    // Workaround React quirk that triggers "Switch to client-side rendering" if
    // we return no Suspense boundary here.
    return <Suspense />
  }

  if (!mounted) {
    // Workaround React quirk that triggers "Switch to client-side rendering" if
    // we return no Suspense boundary here.
    return <Suspense />
  }

  return (
    <Errors transitionDurationMs={transitionDurationMs} rendered={rendered} />
  )
}
