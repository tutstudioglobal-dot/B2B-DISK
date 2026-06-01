'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import { useAuth } from '@/context/AuthContext'
import { t } from '@/lib/i18n'
import { supabaseSyncInventory, getSupabase } from '@/lib/supabase'
import CacheSyncFAB from '@/components/CacheSyncFAB'

const NAV_ITEMS = [
  { id: 'overview', icon: 'fa-gauge-high', href: '/dashboard' },
  { id: 'products', icon: 'fa-boxes-stacked', href: '/products' },
  { id: 'inventory', icon: 'fa-warehouse', href: '/inventory' },
  { id: 'tenders', icon: 'fa-helmet-safety', href: '/tenders' },
  { id: 'ds', icon: 'fa-truck-fast', href: '/direct-supply' },
  { id: 'accounting', icon: 'fa-calculator', href: '/accounting' },
  { id: 'settings', icon: 'fa-gear', href: '/settings' },
]

function navId(id) { return id === 'ds' ? 'directSupply' : id }

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const pathname = usePathname()
  const { lang, toggleLang } = useLang()
  const { user, switchRole } = useAuth()
  const isActive = item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setDrawerOpen(false) }
    window.addEventListener('resize', handleResize)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    return () => window.removeEventListener('resize', handleResize)
  }, [lang])

  const handleForceClearCache = useCallback(async () => {
    if (!window.confirm(lang === 'ar' ? 'مسح كاش المتصفح وإعادة التحميل؟' : 'Clear browser cache and reload?')) return
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
  }, [lang])

  const handleLiveSync = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      alert(lang === 'ar' ? 'Supabase غير مهيأ. أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }
    const ok = await supabaseSyncInventory()
    if (ok) {
      alert(lang === 'ar' ? '✅ تمت المزامنة — أحدث البيانات من Supabase' : '✅ Synced — latest data from Supabase')
    } else {
      alert(lang === 'ar' ? '❌ فشلت المزامنة' : '❌ Sync failed')
    }
  }, [lang])

  function getNotifItems() {
    try {
      const raw = localStorage.getItem('sapkey_next_store')
      const store = raw ? JSON.parse(raw) : {}
      const items = []
      const p = store.products_v2 || []; const tn = store.tenders || []; const d = store.direct_supply || []
      const logs = store.price_history_logs || []
      if (p.length) items.push({ icon: 'fa-boxes-stacked', color: '#0ECB81', text: `${t('products.title', lang)}: ${p.length}`, time: t('common.refresh', lang) })
      if (tn.length) items.push({ icon: 'fa-helmet-safety', color: '#A66CFF', text: `${t('nav.tenders', lang)}: ${tn.length}`, time: t('common.refresh', lang) })
      if (d.length) items.push({ icon: 'fa-truck-fast', color: '#F0A90B', text: `${t('nav.directSupply', lang)}: ${d.length}`, time: t('common.refresh', lang) })
      if (logs.length) items.push({ icon: 'fa-chart-line', color: '#1E80FF', text: `${t('products.lastPriceUpdate', lang)}: ${logs[logs.length-1]?.productName || '—'}`, time: logs[logs.length-1]?.timestamp || '—' })
      if (!items.length) items.push({ icon: 'fa-info-circle', color: '#6B7280', text: t('common.noData', lang), time: '—' })
      return items.slice(0, 5)
    } catch { return [] }
  }

  const userLabel = user?.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'Admin') : (lang === 'ar' ? 'محاسب مالي' : 'Accountant')
  const userName = lang === 'ar' ? user?.name_ar : user?.name_en

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sb-logo">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #0ECB81, #1E80FF)' }}>
              <span className="text-lg font-black text-white">S</span>
            </div>
            <div className="text-start">
              <h1 className="text-base font-bold" style={{ background: 'linear-gradient(to left, #0ECB81, #1E80FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SAPKEY</h1>
              <div className="text-[10px] text-[#6B7280] leading-tight -mt-0.5">{t('nav.appTitle', lang)}</div>
            </div>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV_ITEMS.map(item => (
            <a key={item.id} href={item.href} className={isActive(item) ? 'active' : ''}>
              <span className="icon"><i className={`fas ${item.icon}`}></i></span>
              <span>{t(`nav.${navId(item.id)}`, lang)}</span>
            </a>
          ))}
        </nav>
        <div className="absolute bottom-4 start-4 end-4 space-y-2">
          <button onClick={toggleLang} className="w-full text-xs text-[#6B7280] hover:text-[#9CA3AF] bg-transparent border-none cursor-pointer flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-[#1A1A2E] transition-all">
            <i className="fas fa-globe text-[10px]"></i> {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>

      {/* ===== TOPBAR ===== */}
      <div className="header-sticky fixed top-0 inset-x-0 h-14 border-b border-[#2A2A3E] flex items-center justify-between px-3 sm:px-4 z-40" style={{ marginInlineStart: sidebarOpen ? '16rem' : '0' }}>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex text-[#9CA3AF] hover:text-white cursor-pointer bg-transparent border-none w-8 h-8 items-center justify-center rounded-lg hover:bg-[#1A1A2E] transition-all" title={sidebarOpen ? t('common.close', lang) : t('common.back', lang)}>
            <i className="fas fa-bars"></i>
          </button>
          <button onClick={() => setDrawerOpen(!drawerOpen)} className="lg:hidden text-[#9CA3AF] hover:text-white cursor-pointer bg-transparent border-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1A1A2E] transition-all" aria-label="Toggle menu">
            <i className={`fas ${drawerOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
          </button>
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="text-[#9CA3AF] hover:text-white cursor-pointer bg-transparent border-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1A1A2E] transition-all relative" title={t('nav.quickView', lang)}>
              <i className="fas fa-bell text-sm sm:text-base"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#0ECB81] rounded-full"></span>
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl shadow-2xl z-40 py-2">
                  <div className="px-3 py-2 text-xs text-[#9CA3AF] border-b border-[#2A2A3E] font-medium">{t('nav.quickView', lang)}</div>
                  {getNotifItems().map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#0E0E1A]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                        <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: 11 }}></i>
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="text-white truncate">{item.text}</div>
                        <div className="text-[#6B7280] truncate">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Live Sync */}
          <button onClick={handleLiveSync} className="text-[#0ECB81] hover:text-white bg-transparent border border-[#0ECB81]/30 hover:border-[#0ECB81] w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer" title={lang === 'ar' ? 'مزامنة البيانات فورياً' : 'Live Sync Data'}>
            <i className="fas fa-sync-alt text-[10px] sm:text-xs"></i>
            <span className="hidden sm:inline">{lang === 'ar' ? 'مزامنة' : 'Sync'}</span>
          </button>
          {/* Clear Cache */}
          <button onClick={handleForceClearCache} className="text-[#F0A90B] hover:text-white bg-transparent border border-[#F0A90B]/30 hover:border-[#F0A90B] w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer" title={lang === 'ar' ? 'تحديث النظام ومسح الكاش' : 'Force Clear Cache'}>
            <i className="fas fa-trash-clock text-[10px] sm:text-xs"></i>
            <span className="hidden sm:inline">{lang === 'ar' ? 'مسح كاش' : 'Clear Cache'}</span>
          </button>
          {/* Language Toggle */}
          <button onClick={toggleLang} className="text-xs text-[#6B7280] hover:text-[#9CA3AF] bg-transparent border-none cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1A1A2E] transition-all" title={lang === 'ar' ? 'English' : 'العربية'}>
            <i className="fas fa-globe"></i>
          </button>
          {/* Role Switcher */}
          <div className="relative">
            <button onClick={() => setRoleMenuOpen(!roleMenuOpen)} className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white bg-transparent border border-[#2A2A3E] hover:border-[#3A3A5E] px-2 py-1.5 rounded-lg transition-all cursor-pointer">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${user?.role === 'admin' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#1E80FF]/20 text-[#1E80FF]'}`}>
                {userName?.charAt(0) || '?'}
              </div>
              <span className="hidden sm:inline">{userLabel}</span>
              <i className="fas fa-chevron-down text-[8px]"></i>
            </button>
            {roleMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setRoleMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl shadow-2xl z-40 py-2">
                  <div className="px-3 py-2 text-xs text-[#6B7280] border-b border-[#2A2A3E]">
                    {lang === 'ar' ? 'تبديل الصلاحية' : 'Switch Role'}
                  </div>
                  <button
                    onClick={() => { switchRole('admin'); setRoleMenuOpen(false) }}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-[#0E0E1A] transition-all cursor-pointer border-none bg-transparent ${user?.role === 'admin' ? 'text-[#0ECB81]' : 'text-[#9CA3AF]'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0ECB81]/20 flex items-center justify-center shrink-0">
                      <i className="fas fa-shield-halved text-[#0ECB81] text-sm"></i>
                    </div>
                    <div className="text-start">
                      <div className="font-medium text-white">{lang === 'ar' ? 'مدير النظام' : 'System Admin'}</div>
                      <div className="text-[10px] text-[#6B7280]">{lang === 'ar' ? 'صلاحية كاملة للإدارة والتسعير' : 'Full management & pricing access'}</div>
                    </div>
                    {user?.role === 'admin' && <i className="fas fa-check text-[#0ECB81]"></i>}
                  </button>
                  <button
                    onClick={() => { switchRole('accountant'); setRoleMenuOpen(false) }}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-[#0E0E1A] transition-all cursor-pointer border-none bg-transparent ${user?.role === 'accountant' ? 'text-[#0ECB81]' : 'text-[#9CA3AF]'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1E80FF]/20 flex items-center justify-center shrink-0">
                      <i className="fas fa-calculator text-[#1E80FF] text-sm"></i>
                    </div>
                    <div className="text-start">
                      <div className="font-medium text-white">{lang === 'ar' ? 'محاسب مالي' : 'Financial Accountant'}</div>
                      <div className="text-[10px] text-[#6B7280]">{lang === 'ar' ? 'صلاحية الجرد والتقارير المالية' : 'Stock audit & financial reports'}</div>
                    </div>
                    {user?.role === 'accountant' && <i className="fas fa-check text-[#0ECB81]"></i>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      {drawerOpen && <div className="drawer-overlay lg:hidden" onClick={() => setDrawerOpen(false)}></div>}
      <div className={`mobile-drawer lg:hidden ${drawerOpen ? 'open' : ''}`}>
        <div className="sb-logo">
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #0ECB81, #1E80FF)' }}>
              <span className="text-lg font-black text-white">S</span>
            </div>
            <div className="text-start">
              <h1 className="text-base font-bold" style={{ background: 'linear-gradient(to left, #0ECB81, #1E80FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SAPKEY</h1>
              <div className="text-[10px] text-[#6B7280] leading-tight -mt-0.5">{t('nav.appTitle', lang)}</div>
            </div>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV_ITEMS.map(item => (
            <a key={item.id} href={item.href} className={isActive(item) ? 'active' : ''} onClick={() => setDrawerOpen(false)}>
              <span className="icon"><i className={`fas ${item.icon}`}></i></span>
              <span>{t(`nav.${navId(item.id)}`, lang)}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0E0E1A]/95 backdrop-blur-lg border-t border-[#2A2A3E] z-40 safe-bottom">
        <div className="flex items-center justify-around py-1 px-1">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <a key={item.id} href={item.href} className={`bottom-nav-item ${isActive(item) ? 'active' : ''}`}>
              <i className={`fas ${item.icon}`}></i>
              <span>{t(`nav.${navId(item.id)}`, lang)}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ===== FLOATING FAB ===== */}
      <CacheSyncFAB />

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
