import './devtools-indicator.css'
import type { CSSProperties } from 'react'
import { Toast } from '../toast'
import {
  MENU_CURVE,
  MENU_DURATION_MS,
} from '../errors/dev-tools-indicator/utils'
import { VercelVectorImpl } from '../../agent/vercel-vector-impl'

export const INDICATOR_PADDING = 20

// Quick clone of DevToolsIndicator for demo purposes only
export function VercelVector() {
  const position = 'bottom-right'
  const [vertical, horizontal] = position.split('-', 2)

  return (
    // TODO: why is this called a toast
    <Toast
      id="devtools-indicator"
      data-nextjs-toast
      style={
        {
          '--animate-out-duration-ms': `${MENU_DURATION_MS}ms`,
          '--animate-out-timing-function': MENU_CURVE,
          boxShadow: 'none',
          [vertical]: `${INDICATOR_PADDING}px`,
          [horizontal]: `${INDICATOR_PADDING}px`,
        } as CSSProperties
      }
    >
      <VercelVectorImpl />
    </Toast>
  )
}
