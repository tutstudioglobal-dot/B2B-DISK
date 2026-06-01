'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import { getInventory, getAuditLogs, updateInventoryQuantity, isSupabaseReady, supabaseSyncInventory } from '@/lib/supabase'

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [supabaseOn, setSupabaseOn] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    setSupabaseOn(isSupabaseReady())
    loadData()
  }, [lang])

  async function loadData() {
    setLoading(true)
    const inv = await getInventory()
    const logs = await getAuditLogs()
    setItems(inv || [])
    setAuditLogs(logs || [])
    setLoading(false)
  }

  async function handleAdjust(itemCode) {
    if (adjustQty < 0) return
    await updateInventoryQuantity(itemCode, adjustQty, localStorage.getItem('sapkey_user') ? JSON.parse(localStorage.getItem('sapkey_user')).name_ar : 'user')
    setAdjustModal(null)
    loadData()
  }

  async function handleSupabaseSync() {
    const ok = await supabaseSyncInventory()
    if (ok) { loadData(); alert('Supabase sync completed') }
    else alert('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const filtered = items.filter(i => {
    if (!search) return true
    const q = search.toLowerCase()
    return (i.item_code?.toLowerCase().includes(q) || i.item_name_ar?.includes(search) || i.item_name_en?.toLowerCase().includes(q))
  })

  const totalStock = items.reduce((s, i) => s + (i.quantity || 0), 0)
  const totalValue = items.reduce((s, i) => s + ((i.quantity || 0) * (i.unit_price || 0)), 0)
  const lowStockItems = items.filter(i => (i.quantity || 0) <= (i.min_stock || 50))

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{t('inventory.subtitle', lang)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {supabaseOn && (
            <button className="btn-outline text-sm" onClick={handleSupabaseSync}>
              <i className="fas fa-cloud-download-alt ms-1 text-[#1E80FF]"></i> Sync Supabase
            </button>
          )}
          <button className="btn-outline text-sm" onClick={() => router.push('/inventory/stock-audit')}>
            <i className="fas fa-clipboard-list ms-1 text-[#A66CFF]"></i> {t('inventory.stockAudit', lang)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card stat-card p-4 sm:p-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2 bg-[#0ECB81]/20">
            <i className="fas fa-boxes-stacked text-[#0ECB81]"></i>
          </div>
          <div className="value text-[#0ECB81]">{items.length.toLocaleString()}</div>
          <div className="label">{t('products.title', lang)}</div>
        </div>
        <div className="card stat-card p-4 sm:p-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2 bg-[#1E80FF]/20">
            <i className="fas fa-cubes text-[#1E80FF]"></i>
          </div>
          <div className="value text-[#1E80FF]">{totalStock.toLocaleString()}</div>
          <div className="label">{t('inventory.qty', lang)}</div>
        </div>
        <div className="card stat-card p-4 sm:p-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2 bg-[#F0A90B]/20">
            <i className="fas fa-coins text-[#F0A90B]"></i>
          </div>
          <div className="value text-[#F0A90B] text-lg">{totalValue.toLocaleString()} {t('common.egp', lang)}</div>
          <div className="label">{t('inventory.totalValue', lang)}</div>
        </div>
        <div className="card stat-card p-4 sm:p-6 cursor-pointer" onClick={() => setSearch('')}>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2 bg-[#F6465D]/20">
            <i className="fas fa-exclamation-triangle text-[#F6465D]"></i>
          </div>
          <div className="value text-[#F6465D]">{lowStockItems.length}</div>
          <div className="label">{t('inventory.lowStock', lang)}</div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="card border-[#F6465D]/30">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-bell text-[#F6465D]"></i>
            <h2 className="text-lg font-bold">{t('inventory.stockAlert', lang)}</h2>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map(item => (
              <div key={item.item_code} className="flex items-center justify-between text-sm p-2 bg-[#0E0E1A] rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#F6465D] font-mono text-xs">{item.item_code}</span>
                  <span className="truncate">{lang === 'ar' ? item.item_name_ar : item.item_name_en || item.item_name_ar}</span>
                </div>
                <span className={`font-bold ${item.quantity <= 0 ? 'text-[#F6465D]' : 'text-[#F0A90B]'}`}>
                  {item.quantity <= 0 ? t('inventory.outOfStock', lang) : `${item.quantity} ${t('common.unit', lang)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-wrap">
        <i className="fas fa-search search-icon"></i>
        <input className="input search-input" placeholder={`${t('common.search', lang)} ${t('inventory.title', lang)}...`} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="loading-spinner w-8 h-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><i className="fas fa-warehouse"></i></div>
          <div className="text">{t('common.noData', lang)}</div>
        </div>
      ) : (
        <div className="table-wrap scroll-wrap rounded-xl">
          <table>
            <thead>
              <tr>
                <th>{t('inventory.itemCode', lang)}</th>
                <th>{t('inventory.itemName', lang)}</th>
                <th>{t('inventory.origin', lang)}</th>
                <th>{t('inventory.qty', lang)}</th>
                <th>{t('inventory.unitPrice', lang)}</th>
                <th>{t('inventory.totalValue', lang)}</th>
                <th>{t('inventory.certificates', lang)}</th>
                <th>{t('common.actions', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isLow = (item.quantity || 0) <= (item.min_stock || 50)
                const isOut = !item.quantity || item.quantity <= 0
                return (
                  <tr key={item.item_code || item.id}>
                    <td className="font-mono text-xs">{item.item_code}</td>
                    <td className="max-w-[200px] truncate">{lang === 'ar' ? item.item_name_ar : item.item_name_en || item.item_name_ar}</td>
                    <td>{item.origin_ar || item.origin_en || '—'}</td>
                    <td>
                      <span className={`font-bold ${isOut ? 'text-[#F6465D]' : isLow ? 'text-[#F0A90B]' : 'text-[#0ECB81]'}`}>
                        {isOut ? t('inventory.outOfStock', lang) : `${item.quantity.toLocaleString()} ${t('common.unit', lang)}`}
                      </span>
                    </td>
                    <td>{item.unit_price?.toLocaleString()} {t('common.egp', lang)}</td>
                    <td className="font-bold">{((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()} {t('common.egp', lang)}</td>
                    <td className="max-w-[120px] truncate text-xs">{item.certificates || '—'}</td>
                    <td>
                      <button className="btn-outline text-xs py-1 px-2" onClick={() => { setAdjustModal(item); setAdjustQty(item.quantity || 0) }}>
                        <i className="fas fa-pen text-[10px]"></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('inventory.adjustStock', lang)}</h2>
              <button onClick={() => setAdjustModal(null)} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-[#9CA3AF]">{t('inventory.itemCode', lang)}: </span>
                <span className="font-mono">{adjustModal.item_code}</span>
              </div>
              <div className="text-sm">
                <span className="text-[#9CA3AF]">{t('inventory.itemName', lang)}: </span>
                <span>{lang === 'ar' ? adjustModal.item_name_ar : adjustModal.item_name_en || adjustModal.item_name_ar}</span>
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">{t('inventory.physicalCount', lang)}</label>
                <input className="input" type="number" value={adjustQty} onChange={e => setAdjustQty(Math.max(0, +e.target.value))} min="0" />
              </div>
              <button className="btn-primary w-full" onClick={() => handleAdjust(adjustModal.item_code)}>
                <i className="fas fa-check ms-1"></i> {t('common.save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">{t('inventory.auditLog', lang)}</h2>
          <div className="table-wrap scroll-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('inventory.itemCode', lang)}</th>
                  <th>{t('common.date', lang)}</th>
                  <th>{t('inventory.systemCount', lang)}</th>
                  <th>{t('inventory.physicalCount', lang)}</th>
                  <th>{t('inventory.variance', lang)}</th>
                  <th>{t('inventory.notes', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 20).map(log => {
                  const delta = (log.new_qty || 0) - (log.old_qty || 0)
                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-xs">{log.item_code}</td>
                      <td className="text-xs">{new Date(log.timestamp).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                      <td>{(log.old_qty || 0).toLocaleString()}</td>
                      <td>{(log.new_qty || 0).toLocaleString()}</td>
                      <td className={delta !== 0 ? (delta > 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]') : ''}>
                        {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                      </td>
                      <td className="text-xs text-[#6B7280] max-w-[150px] truncate">{log.reason || log.type || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
