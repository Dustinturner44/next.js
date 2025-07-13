import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from 'react'

export type PanelStateKind =
  | 'preferences'
  | 'route-type'
  | 'segment-explorer'
  | 'panel-selector'
  | 'turbo-info'
  | 'hub'
  | 'fork-url'
  | `dev0-project-${string}`

export const PanelRouterContext = createContext<{
  panels: Set<PanelStateKind>
  setPanels: Dispatch<SetStateAction<Set<PanelStateKind>>>
  openPanel: (panel: PanelStateKind) => void
  closePanel: (panel: PanelStateKind) => void
  togglePanel: (panel: PanelStateKind) => void
  closeAllPanels: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  selectedIndex: number
  setSelectedIndex: Dispatch<SetStateAction<number>>
  bringPanelToFront: (panel: string) => void
  getPanelZIndex: (panel: string) => number
}>(null!)

export const usePanelRouterContext = () => useContext(PanelRouterContext)
