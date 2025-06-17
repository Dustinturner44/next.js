import {
  getIsSuspenseInspected,
  setIsSuspenseInspected,
  subscribe,
} from 'next/dist/compiled/next-devtools'
import {
  createContext,
  use,
  useReducer,
  useState,
  useSyncExternalStore,
} from 'react'

export { setIsSuspenseInspected }

export default function useIsSuspenseInspected() {
  return useSyncExternalStore(
    subscribe,
    getIsSuspenseInspected,
    getIsSuspenseInspected
  )
}

const unresolvedThenable = new Promise<never>((_) => {})
unresolvedThenable.displayName = 'NextSuspenseSimulation'

const SuspenseSimulationContext = createContext<boolean>(false)

export function SimulateSuspend() {
  const isSuspended = use(SuspenseSimulationContext)
  if (isSuspended) {
    use(unresolvedThenable) as never
  }

  return null
}

const segmentClicks = new WeakSet()
const segmentHovers = new WeakSet()
export function SuspenseSimulationWatcher({
  children,
}: {
  children: React.ReactNode
}) {
  const [suspend, toggleSuspend] = useReducer((x) => !x, false)

  function handleSegmentClick(event: React.MouseEvent) {
    // can't use stopPropagation or preventDefault since that would pollute userspace.
    if (!segmentClicks.has(event)) {
      segmentClicks.add(event)
      toggleSuspend()
    }
  }

  const [isHovered, setIsHovered] = useState(false)
  function handlePointerOver(event: React.PointerEvent) {
    if (!segmentHovers.has(event)) {
      segmentHovers.add(event)
      setIsHovered(true)
    }
  }
  function handlePointerOut(event: React.PointerEvent) {
    if (!segmentHovers.has(event)) {
      segmentHovers.add(event)
      setIsHovered(false)
    }
  }

  return (
    // TODO: Fragment Refs
    <div
      // TODO: Draw Canvas instead
      style={isHovered ? { outline: '1px solid red' } : undefined}
      onClick={handleSegmentClick}
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
    >
      <SuspenseSimulationContext value={suspend}>
        {children}
      </SuspenseSimulationContext>
    </div>
  )
}
