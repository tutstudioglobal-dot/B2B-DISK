'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { supabaseSyncInventory, getSupabase } from '@/lib/supabase'

export default function CacheSyncFAB() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 16, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setPos(p => ({ ...p, y: window.innerHeight - 180 }))
  }, [])

  const handleMouseDown = useCallback((e) => {
    setDragging(true)
    const rect = dragRef.current.getBoundingClientRect()
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e) => {
      setPos({
        x: Math.max(4, Math.min(window.innerWidth - 52, e.clientX - offsetRef.current.x)),
        y: Math.max(4, Math.min(window.innerHeight - 52, e.clientY - offsetRef.current.y)),
      })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp) }
  }, [dragging])

  const handleForceClearCache = useCallback(async () => {
    if (!window.confirm('مسح كاش المتصفح وإعادة التحميل؟')) return
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      localStorage.removeItem('cached_stats')
      localStorage.removeItem('cached_inventory')
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) { await registration.unregister() }
      }
    } catch {}
    window.location.reload(true)
  }, [])

  const handleLiveSync = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      alert('Supabase غير مهيأ. أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }
    const ok = await supabaseSyncInventory()
    if (ok) {
      alert('✅ تمت المزامنة — أحدث البيانات من Supabase')
    } else {
      alert('❌ فشلت المزامنة')
    }
  }, [])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <div
        ref={dragRef}
        className="fixed z-50"
        style={{ left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <div className="relative">
          <button
            onMouseDown={handleMouseDown}
            onClick={() => setOpen(!open)}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0ECB81] to-[#1E80FF] text-white shadow-2xl flex items-center justify-center text-lg transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
            style={{ touchAction: 'none' }}
          >
            <i className={`fas ${open ? 'fa-xmark' : 'fa-wrench'}`}></i>
          </button>

          {open && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col gap-2" style={{ direction: 'rtl' }}>
              <button
                onClick={handleLiveSync}
                className="flex items-center gap-2 bg-[#0ECB81] text-white text-xs px-3 py-2 rounded-xl shadow-xl hover:brightness-110 transition-all border border-white/10 whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-sync-alt"></i>
                <span>مزامنة</span>
              </button>
              <button
                onClick={handleForceClearCache}
                className="flex items-center gap-2 bg-[#F0A90B] text-white text-xs px-3 py-2 rounded-xl shadow-xl hover:brightness-110 transition-all border border-white/10 whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-trash-clock"></i>
                <span>مسح كاش</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
