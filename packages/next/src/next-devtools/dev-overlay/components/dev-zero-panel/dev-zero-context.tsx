import React, { createContext, useContext, useState } from 'react'

interface Dev0PanelContextType {
  refreshKey: number
  setRefreshKey: (key: number) => void
  isRefreshing: boolean
  setIsRefreshing: (refreshing: boolean) => void
}

const Dev0PanelContext = createContext<Dev0PanelContextType | undefined>(undefined)

export function Dev0PanelProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  return (
    <Dev0PanelContext.Provider value={{ refreshKey, setRefreshKey, isRefreshing, setIsRefreshing }}>
      {children}
    </Dev0PanelContext.Provider>
  )
}

export function useDev0Panel() {
  const context = useContext(Dev0PanelContext)
  if (!context) {
    throw new Error('useDev0Panel must be used within Dev0PanelProvider')
  }
  return context
}