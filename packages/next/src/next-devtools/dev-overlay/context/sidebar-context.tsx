import { createContext, useContext, useState, useCallback } from 'react'

interface SidebarContextType {
  isOpen: boolean
  width: number
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  setWidth: (width: number) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export const useSidebarContext = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    // Return default values when used outside of SidebarProvider
    return {
      isOpen: false,
      width: 300,
      openSidebar: () => {},
      closeSidebar: () => {},
      toggleSidebar: () => {},
      setWidth: () => {},
    }
  }
  return context
}

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(300)

  const openSidebar = useCallback(() => setIsOpen(true), [])
  const closeSidebar = useCallback(() => setIsOpen(false), [])
  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), [])

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        width,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        setWidth,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}