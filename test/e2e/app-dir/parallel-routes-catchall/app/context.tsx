'use client'
import { usePathname } from 'next/navigation'
import React from 'react'

const MyContext = React.createContext('default value')

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <MyContext.Provider value={pathname}>{children}</MyContext.Provider>
}
