'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import { getInventory, getAuditLogs } from '@/lib/supabase'

const DASHBOARD_TRANSLATIONS = {
  ar: {
    balanced: 'متوازن / مسوى',
    inventory: 'جرد المخازن',
    shipping: 'شحن ولوجستيات',
    rejected: 'مستبعد / مرفوض',
    underStudy: 'تحت الدراسة والمراجعة',
    activeOrders: 'طلبات توريد نشطة',
    tasksToday: 'مهام وتوصيات اليوم',
    directSupply: 'توريد مباشر طارئ',
    tenders: 'المناقصات والممارسات',
    availableStock: 'المخزون المتاح الفعلي',
    qty: 'الكمية',
    itemCode: 'كود الصنف',
    status: 'الحالة',
    todayPanelTitle: 'مؤشرات الأداء والجودة',
    readyForShipment: 'جاهز للشحن',
    pendingReview: 'قيد المراجعة',
  },
  en: {
    balanced: 'Balanced / Settled',
    inventory: 'Stock Audit',
    shipping: 'Shipping & Logistics',
    rejected: 'Rejected / Disqualified',
    underStudy: 'Under Study & Review',
    activeOrders: 'Active Supply Orders',
    tasksToday: "Today's Tasks & Alerts",
    directSupply: 'Direct Supply (RFQ)',
    tenders: 'Tenders & Contracts',
    availableStock: 'Available Physical Stock',
    qty: 'Qty',
    itemCode: 'Item Code',
    status: 'Status',
    todayPanelTitle: 'Quality & Performance Indicators',
    readyForShipment: 'Ready for Shipment',
    pendingReview: 'Pending Review',
  },
}

const DT = (lang) => DASHBOARD_TRANSLATIONS[lang] || DASHBOARD_TRANSLATIONS.ar

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, tenders: 0, ds: 0, users: 0, invItems: 0, invLow: 0 })
  const [auditLogs, setAuditLogs] = useState([])
  const [activities, setActivities] = useState([])
  const [seedState, setSeedState] = useState('idle')
  const [seedProgress, setSeedProgress] = useState(0)
  const [seedMsg, setSeedMsg] = useState('')
  const router = useRouter()
  const { lang } = useLang()

  function getStore() {
    try {
      const raw = localStorage.getItem('sapkey_next_store')
      return raw ? JSON.parse(raw) : { products_v2: [], tenders: [], direct_supply: [], users: [], price_history_logs: [], consumption_analytics: [] }
    } catch { return { products_v2: [], tenders: [], direct_supply: [], users: [], price_history_logs: [], consumption_analytics: [] } }
  }

  async function refreshStats() {
    const store = getStore()
    const inv = await getInventory()
    const logs = await getAuditLogs()
    setAuditLogs(logs || [])
    setStats({
      products: store.products_v2?.length || 0,
      tenders: store.tenders?.length || 0,
      ds: store.direct_supply?.length || 0,
      users: store.users?.length || 0,
      invItems: inv.length,
      invLow: inv.filter(i => (i.quantity || 0) <= (i.min_stock || 50)).length,
    })
    const acts = []
    if (store.products_v2?.length) acts.push({ action: `${t('products.title', lang)}: ${store.products_v2.length}`, time: t('common.refresh', lang), icon: 'fa-boxes-stacked', color: '#0ECB81' })
    if (store.tenders?.length) acts.push({ action: `${t('nav.tenders', lang)}: ${store.tenders.length}`, time: t('common.refresh', lang), icon: 'fa-helmet-safety', color: '#A66CFF' })
    if (store.direct_supply?.length) acts.push({ action: `${t('nav.directSupply', lang)}: ${store.direct_supply.length}`, time: t('common.refresh', lang), icon: 'fa-truck-fast', color: '#F0A90B' })
    const priceLogs = store.price_history_logs || []
    if (priceLogs.length > 0) {
      const last = priceLogs[priceLogs.length - 1]
      acts.push({ action: `${t('products.lastPriceUpdate', lang)}: ${last.productName}`, time: last.timestamp || '—', icon: 'fa-chart-line', color: '#1E80FF' })
    }
    if (stats.invItems > 0) {
      acts.push({ action: `${t('inventory.title', lang)}: ${stats.invItems} ${t('common.unit', lang)}`, time: t('common.refresh', lang), icon: 'fa-warehouse', color: '#1E80FF' })
    }
    if (stats.invLow > 0) {
      acts.push({ action: `${t('inventory.lowStock', lang)}: ${stats.invLow}`, time: t('inventory.stockAudit', lang), icon: 'fa-exclamation-triangle', color: '#F6465D' })
    }
    if (!acts.length) acts.push({ action: t('dashboard.title', lang) + ' ' + t('common.loading', lang), time: t('common.refresh', lang), icon: 'fa-gauge-high', color: '#6B7280' })
    setActivities(acts)
  }

  useEffect(() => { refreshStats() }, [lang])

  const runSeed = useCallback(async () => {
    if (seedState === 'running') return
    setSeedState('running'); setSeedProgress(0); setSeedMsg(t('dashboard.seedProgress', lang) + '...')
    try {
      const total = 10000
      const { generateInfiniteSeed } = await import('@/lib/seed')
      const result = generateInfiniteSeed(total)
      const store = getStore()
      const batchSize = 1000
      const allProducts = result.products || []
      const totalBatches = Math.ceil(allProducts.length / batchSize)
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize
        const end = Math.min(start + batchSize, allProducts.length)
        store.products_v2 = [...(store.products_v2 || []), ...allProducts.slice(start, end)]
        if (result.priceHistory) store.price_history_logs = [...(store.price_history_logs || []), ...result.priceHistory.slice(start, end)]
        if (result.consumptionAnalytics) store.consumption_analytics = [...(store.consumption_analytics || []), ...result.consumptionAnalytics.slice(start, end)]
        localStorage.setItem('sapkey_next_store', JSON.stringify(store))
        setSeedProgress(Math.round(((i + 1) / totalBatches) * 100))
        setSeedMsg(`${t('dashboard.seedProgress', lang)} ${Math.min(end, total).toLocaleString()}/${total.toLocaleString()}`)
        await new Promise(r => setTimeout(r, 50))
      }
      setSeedMsg(`✅ ${t('dashboard.seedDone', lang)}! ${allProducts.length.toLocaleString()} ${t('products.title', lang)}`)
      setSeedState('done'); refreshStats()
    } catch (e) {
      setSeedMsg(`❌ ${e.message}`); setSeedState('error')
    }
  }, [seedState, lang])

  const dt = DT(lang)
  const totalVariance = auditLogs.filter(l => l.type === 'adjustment' || l.type === 'ds_sync').reduce((s, l) => s + ((l.new_qty || 0) - (l.old_qty || 0)), 0)
  const dsCount = stats.ds
  const activeCount = getStore().direct_supply?.filter(d => d.status !== 'completed').length || 0

  const statCards = [
    { label: t('dashboard.statsProducts', lang), value: stats.products, icon: 'fa-boxes-stacked', color: '#0ECB81', href: '/products' },
    { label: dt.inventory, value: stats.invItems, icon: 'fa-warehouse', color: '#1E80FF', href: '/inventory' },
    { label: dt.tenders, value: stats.tenders, icon: 'fa-helmet-safety', color: '#A66CFF', href: '/tenders' },
    { label: dt.directSupply, value: dsCount, icon: 'fa-truck-fast', color: '#F0A90B', href: '/direct-supply' },
    { label: dt.balanced, value: Math.abs(totalVariance), icon: 'fa-scale-balanced', color: '#0ECB81', href: '/inventory/stock-audit' },
    { label: dt.underStudy, value: stats.invLow, icon: 'fa-magnifying-glass-chart', color: '#F0A90B', href: '/inventory/stock-audit' },
    { label: dt.shipping, value: activeCount, icon: 'fa-ship', color: '#A66CFF', href: '/direct-supply' },
    { label: dt.rejected, value: 0, icon: 'fa-ban', color: '#F6465D', href: '/tenders' },
  ]

  const statusCards = [
    { label: dt.balanced, value: Math.abs(totalVariance), color: '#0ECB81', icon: 'fa-scale-balanced' },
    { label: dt.readyForShipment, value: activeCount, color: '#1E80FF', icon: 'fa-truck-fast' },
    { label: dt.pendingReview, value: stats.invLow, color: '#F0A90B', icon: 'fa-clock' },
    { label: dt.underStudy, value: auditLogs.length, color: '#A66CFF', icon: 'fa-magnifying-glass' },
  ]

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.title', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{t('dashboard.subtitle', lang)}</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={runSeed} disabled={seedState === 'running'}>
          <i className={`fas ${seedState === 'running' ? 'fa-spinner fa-spin' : 'fa-database'} ms-1`}></i>
          {seedState === 'running' ? t('dashboard.generating', lang) : t('dashboard.generateSeed', lang)}
        </button>
      </div>

      {seedState !== 'idle' && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <i className={`fas shrink-0 ${seedState === 'running' ? 'fa-spinner fa-spin text-[#F0A90B]' : seedState === 'done' ? 'fa-check-circle text-[#0ECB81]' : 'fa-times-circle text-[#F6465D]'}`}></i>
              <span className={`text-sm truncate ${seedState === 'done' ? 'text-[#0ECB81]' : seedState === 'error' ? 'text-[#F6465D]' : 'text-[#F0A90B]'}`}>{seedMsg}</span>
            </div>
            {seedState === 'done' && (
              <button className="text-xs text-[#6B7280] hover:text-[#9CA3AF] bg-transparent border-none cursor-pointer shrink-0" onClick={() => setSeedState('idle')}>{t('dashboard.hide', lang)}</button>
            )}
          </div>
          {seedState === 'running' && (
            <div className="progress-bar">
              <div className="fill" style={{ width: `${seedProgress}%`, background: 'linear-gradient(to left, #0ECB81, #1E80FF)' }}></div>
            </div>
          )}
        </div>
      )}

      {/* 8 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card cursor-pointer hover:border-[#3A3A5E] transition-all p-4 sm:p-6 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E]" onClick={() => router.push(card.href)}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2" style={{ background: `${card.color}20` }}>
              <i className={`fas ${card.icon}`} style={{ color: card.color }}></i>
            </div>
            <div className="value" style={{ color: card.color }}>{card.value.toLocaleString()}</div>
            <div className="label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Today Panel — Quality & Performance */}
      <div id="stats" className="today-panel grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statusCards.map((card, i) => (
          <div key={i} className="stat-card p-4 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <i className={`fas ${card.icon}`} style={{ color: card.color, fontSize: 12 }}></i>
              </div>
              <span className="text-xs text-[#9CA3AF]">{card.label}</span>
            </div>
            <div className="text-lg font-bold" style={{ color: card.color }}>{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">{t('dashboard.quickActions', lang)}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <button onClick={() => router.push('/products')} className="btn-outline text-center py-3 cursor-pointer">
            <i className="fas fa-plus text-[#0ECB81] block text-xl mb-1"></i>
            <span className="text-xs">{t('dashboard.newProduct', lang)}</span>
          </button>
          <button onClick={() => router.push('/tenders')} className="btn-outline text-center py-3 cursor-pointer">
            <i className="fas fa-file-invoice text-[#A66CFF] block text-xl mb-1"></i>
            <span className="text-xs">{t('dashboard.newTender', lang)}</span>
          </button>
          <button onClick={() => router.push('/inventory')} className="btn-outline text-center py-3 cursor-pointer">
            <i className="fas fa-warehouse text-[#1E80FF] block text-xl mb-1"></i>
            <span className="text-xs">{t('inventory.stockAudit', lang)}</span>
          </button>
          <button onClick={() => router.push('/direct-supply')} className="btn-outline text-center py-3 cursor-pointer">
            <i className="fas fa-truck text-[#F0A90B] block text-xl mb-1"></i>
            <span className="text-xs">{t('dashboard.newDirectSupply', lang)}</span>
          </button>
          <button onClick={runSeed} className="btn-outline text-center py-3 cursor-pointer" disabled={seedState === 'running'}>
            <i className={`fas ${seedState === 'running' ? 'fa-spinner fa-spin' : 'fa-database'} text-[#1E80FF] block text-xl mb-1`}></i>
            <span className="text-xs">{seedState === 'running' ? t('dashboard.generating', lang) : t('dashboard.generateSeed', lang)}</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">{t('dashboard.recentActivity', lang)}</h2>
        {activities.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><i className="fas fa-clock"></i></div>
            <div className="text">{t('dashboard.noActivity', lang)}</div>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((act, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0E0E1A]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${act.color}20` }}>
                  <i className={`fas ${act.icon}`} style={{ color: act.color, fontSize: 12 }}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{act.action}</div>
                  <div className="text-xs text-[#6B7280]">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.products > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">{t('dashboard.consumptionOverview', lang)}</h2>
          <div className="flex items-center justify-center py-6 text-[#9CA3AF] flex-col gap-2">
            <i className="fas fa-chart-simple text-4xl opacity-30"></i>
            <span className="text-sm">{t('dashboard.consumptionHint', lang)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
