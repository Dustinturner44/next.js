import { createContext, useContext, useState, useCallback, useEffect } from 'react'

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
  // Initialize state from localStorage or defaults
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devtools-sidebar-open')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devtools-sidebar-width')
      return saved ? parseInt(saved, 10) : 300
    }
    return 300
  })

  // Persist isOpen state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('devtools-sidebar-open', JSON.stringify(isOpen))
    }
  }, [isOpen])

  // Persist width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('devtools-sidebar-width', width.toString())
    }
  }, [width])

  const openSidebar = useCallback(() => setIsOpen(true), [])
  const closeSidebar = useCallback(() => setIsOpen(false), [])
  const toggleSidebar = useCallback(() => setIsOpen(( prev:any ) => !prev), [])

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