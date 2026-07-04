import React from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HVSMode from './pages/HVSMode.jsx'

function AppInner() {
  const { user, mode } = useApp()
  if (!user) return <Auth />
  if (mode === 'hvs') return <HVSMode />
  return <Dashboard />
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
