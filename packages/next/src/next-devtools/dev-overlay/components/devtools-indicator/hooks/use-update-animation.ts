import { useEffect, useReducer } from 'react'

export function useUpdateAnimation(
  issueCount: number,
  animationDurationMs: number
) {
  const [{ animate, lastSeenIssueCount }, dispatch] = useReducer<
    {
      animate: boolean
      lastSeenIssueCount: number
      lastUpdatedTime: number
    },
    [{ type: 'UPDATE'; payload: number } | { type: 'STOP' }]
  >(
    (pendingState, action) => {
      const actionType = action.type
      switch (actionType) {
        case 'UPDATE':
          const deltaMS =
            pendingState.lastUpdatedTime === -1
              ? Number.POSITIVE_INFINITY
              : performance.now() - pendingState.lastUpdatedTime

          const nextIssueCount = action.payload
          return {
            ...pendingState,
            animate: nextIssueCount > 0 && deltaMS > animationDurationMs,
            lastSeenIssueCount: nextIssueCount,
            lastUpdatedTime: nextIssueCount > 0 ? performance.now() : -1,
          }
        case 'STOP':
          return { ...pendingState, animate: false }
        default:
          actionType satisfies never
          return pendingState
      }
    },
    {
      animate: false,
      lastSeenIssueCount: -1,
      lastUpdatedTime: -1,
    }
  )

  if (issueCount !== lastSeenIssueCount) {
    dispatch({
      type: 'UPDATE',
      payload: issueCount,
    })
  }

  useEffect(() => {
    if (animate) {
      // It is important to use a CSS transitioned state, not a CSS keyframed animation
      // because if the issue count increases faster than the animation duration, it
      // will abruptly stop and not transition smoothly back to its original state.
      const timeoutId = window.setTimeout(() => {
        dispatch({ type: 'STOP' })
      }, animationDurationMs)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [animationDurationMs, animate])

  return animate
}
