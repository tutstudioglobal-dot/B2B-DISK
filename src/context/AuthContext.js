'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const USERS = {
  admin: { name_ar: 'أحمد علي', name_en: 'Ahmed Ali', role: 'admin', label_ar: 'مدير النظام', label_en: 'System Admin' },
  accountant: { name_ar: 'محمد حسن', name_en: 'Mohamed Hassan', role: 'accountant', label_ar: 'محاسب مالي', label_en: 'Financial Accountant' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sapkey_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { setUser(USERS.admin) }
    } else {
      setUser(USERS.admin)
      localStorage.setItem('sapkey_user', JSON.stringify(USERS.admin))
    }
  }, [])

  const switchRole = useCallback((role) => {
    const u = USERS[role] || USERS.admin
    setUser(u)
    localStorage.setItem('sapkey_user', JSON.stringify(u))
  }, [])

  if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) return { user: null, isAdmin: true, switchRole: () => {} }
  return ctx
}
