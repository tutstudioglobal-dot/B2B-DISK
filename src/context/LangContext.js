'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LangContext = createContext()

function applyLang(lang) {
  if (typeof document === 'undefined') return
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.body.style.transition = 'none'
  requestAnimationFrame(() => { document.body.style.transition = '' })
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ar')
  const [mounted, setMounted] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sapkey_lang')
    const initial = saved === 'en' || saved === 'ar' ? saved : 'ar'
    setLang(initial)
    applyLang(initial)
  }, [])

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'ar' ? 'en' : 'ar'
      localStorage.setItem('sapkey_lang', next)
      applyLang(next)
      setVersion(v => v + 1)
      return next
    })
  }, [])

  const changeLang = useCallback((newLang) => {
    if (newLang !== 'ar' && newLang !== 'en') return
    setLang(newLang)
    localStorage.setItem('sapkey_lang', newLang)
    applyLang(newLang)
    setVersion(v => v + 1)
  }, [])

  if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, toggleLang, version }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) return { lang: 'ar', setLang: () => {}, toggleLang: () => {}, version: 0 }
  return ctx
}
