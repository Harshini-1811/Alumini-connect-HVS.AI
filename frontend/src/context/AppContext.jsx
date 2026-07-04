import React, { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('main')   // 'main' | 'hvs'
  const [theme, setTheme] = useState('dark')

  function logout() {
    setUser(null)
    setMode('main')
    window.speechSynthesis?.cancel()
  }

  return (
    <Ctx.Provider value={{ user, setUser, mode, setMode, theme, setTheme, logout }}>
      <div data-theme={theme} style={{ height: '100vh', overflow: 'hidden' }}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
