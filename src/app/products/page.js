'use client'
import { useState, useEffect, useCallback } from 'react'
import { calculateComprehensivePricing } from '@/lib/pricing'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'

const CAT_COLORS = { PET: '#0ECB81', HSE: '#1E80FF', WRK: '#FF6B2B', OFF: '#A66CFF' }
const CAT_NAMES = {
  PET: { ar: 'معدات بترول', en: 'Petroleum' },
  HSE: { ar: 'أمن صناعي', en: 'Safety' },
  WRK: { ar: 'عدد وورش', en: 'Workshop' },
  OFF: { ar: 'مكتبي', en: 'Office' },
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [consumption, setConsumption] = useState({})
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCalc, setShowCalc] = useState(false)
  const [calcResult, setCalcResult] = useState(null)
  const [calcInputs, setCalcInputs] = useState({ cost: 0, margin: 25, shipping: 0, other: 0, contingency: 2, tax: 3 })
  const { lang } = useLang()

  useEffect(() => { loadProducts() }, [search, catFilter, lang])

  function loadProducts() {
    setLoading(true)
    try {
      const raw = localStorage.getItem('sapkey_next_store')
      const store = raw ? JSON.parse(raw) : {}
      let items = store.products_v2 || []
      const consMap = {}
      if (store.consumption_analytics) {
        store.consumption_analytics.forEach(c => { consMap[c.product_id] = c })
      }
      if (store.price_history_logs) {
        store.price_history_logs.forEach(log => { consMap[log.productId] = { ...consMap[log.productId], lastPrice: log.price, lastDate: log.timestamp } })
      }
      setConsumption(consMap)
      if (search) {
        const q = search.toLowerCase()
        items = items.filter(p => p.item_code?.toLowerCase().includes(q) || p.item_name_ar?.includes(search) || p.item_name_en?.toLowerCase().includes(q))
      }
      if (catFilter) items = items.filter(p => p.category_id === catFilter)
      setProducts(items.slice(0, 100))
    } catch {}
    setLoading(false)
  }

  const calcPrice = useCallback(() => {
    const r = calculateComprehensivePricing(calcInputs.cost, calcInputs.margin, {
      contingencyPct: calcInputs.contingency, shippingCost: calcInputs.shipping,
      otherExpenses: calcInputs.other, governmentTaxesPct: calcInputs.tax,
    })
    setCalcResult(r)
  }, [calcInputs])

  async function exportExcel() {
    try {
      const ExcelJS = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Products')
      ws.views = [{ rightToLeft: lang === 'ar' }]
      ws.columns = [
        { header: 'Item Code', key: 'item_code', width: 20 },
        { header: 'Name (AR)', key: 'item_name_ar', width: 40 },
        { header: 'Category', key: 'category_ar', width: 25 },
        { header: 'Origin', key: 'origin_ar', width: 20 },
        { header: 'Certificates', key: 'certificates', width: 30 },
        { header: 'Cost Price', key: 'cost_price', width: 15 },
        { header: 'Margin %', key: 'admin_margin_pct', width: 12 },
        { header: 'Selling Price', key: 'selling_price', width: 15 },
      ]
      const store = JSON.parse(localStorage.getItem('sapkey_next_store') || '{}')
      ;(store.products_v2 || []).slice(0, 200).forEach(p => ws.addRow(p))
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `SAPKEY_Products_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click(); URL.revokeObjectURL(url)
    } catch (e) { alert('Excel export error: ' + e.message) }
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('products.title', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{t('products.subtitle', lang)}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="btn-outline text-sm" onClick={exportExcel}>
            <i className="fas fa-file-excel ms-1 text-[#0ECB81]"></i> {t('products.exportExcel', lang)}
          </button>
          <button className="btn-secondary text-sm" onClick={() => setShowCalc(true)}>
            <i className="fas fa-calculator ms-1"></i> {t('products.pricing', lang)}
          </button>
        </div>
      </div>

      {showCalc && (
        <div className="modal-overlay" onClick={() => setShowCalc(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('products.pricing', lang)}</h2>
              <button onClick={() => setShowCalc(false)} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.baseCost', lang)}</label><input className="input" type="number" value={calcInputs.cost} onChange={e => setCalcInputs({...calcInputs, cost: +e.target.value})} /></div>
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.profitMargin', lang)}</label><input className="input" type="number" value={calcInputs.margin} onChange={e => setCalcInputs({...calcInputs, margin: +e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.shipping', lang)}</label><input className="input" type="number" value={calcInputs.shipping} onChange={e => setCalcInputs({...calcInputs, shipping: +e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.contingency', lang)}</label><input className="input" type="number" value={calcInputs.contingency} onChange={e => setCalcInputs({...calcInputs, contingency: +e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.otherExpenses', lang)}</label><input className="input" type="number" value={calcInputs.other} onChange={e => setCalcInputs({...calcInputs, other: +e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.tax', lang)}</label><input className="input" type="number" value={calcInputs.tax} onChange={e => setCalcInputs({...calcInputs, tax: +e.target.value})} /></div>
              </div>
              <button className="btn-primary w-full" onClick={calcPrice}>{t('products.calculate', lang)}</button>
              {calcResult && (
                <div className="p-3 bg-[#0E0E1A] rounded-xl">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('products.finalPrice', lang)}</span>
                    <span className="text-[#0ECB81]">{calcResult.finalPriceForClient.toLocaleString()} {t('common.egp', lang)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="search-wrap flex-1">
          <i className="fas fa-search search-icon"></i>
          <input className="input search-input" placeholder={`${t('common.search', lang)}...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">{t('common.all', lang)}</option>
          {Object.entries(CAT_NAMES).map(([k, v]) => (
            <option key={k} value={k}>{v[lang]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="loading-spinner w-8 h-8" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><i className="fas fa-box"></i></div>
          <div className="text">{t('common.noData', lang)}</div>
        </div>
      ) : (
        <div className="grid-cards">
          {products.map((p, i) => {
            const color = CAT_COLORS[p.category_id] || '#6B7280'
            const ca = consumption[p.item_code] || consumption[p.id]
            const isHighDemand = ca && ca.demand_rank && ca.demand_rank <= 2
            return (
              <div key={p.item_code || i} className="card animate-in" style={{ borderTop: `3px solid ${color}` }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-[#6B7280] font-mono" dir="ltr">{p.item_code}</span>
                  <span className="badge text-xs" style={{ background: `${color}20`, color }}>{CAT_NAMES[p.category_id]?.[lang] || p.category_id}</span>
                </div>
                <h3 className="font-medium text-sm mb-2 truncate">{lang === 'ar' ? p.item_name_ar : p.item_name_en || p.item_name_ar}</h3>
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-2 flex-wrap">
                  <span><i className="fas fa-globe ms-1"></i>{p.origin_ar || p.origin_en || '—'}</span>
                  {isHighDemand && <span className="badge-green text-[10px]"><i className="fas fa-bolt ms-1"></i>{t('products.highDemand', lang)}</span>}
                  {ca && ca.annual_consumption_qty && <span className="text-[10px]"><i className="fas fa-chart-line ms-1 text-[#1E80FF]"></i>{ca.annual_consumption_qty.toLocaleString()}{t('products.perYear', lang)}</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2A3E]">
                  <span className="font-bold">{p.cost_price?.toLocaleString()} {t('common.egp', lang)}</span>
                  <div className="flex items-center gap-2">
                    {ca && ca.demand_rank && <span className="text-[10px] text-[#6B7280]">{t('products.demand', lang)}:{'★'.repeat(Math.max(1, 5 - ca.demand_rank))}</span>}
                    <span style={{ color }}>{p.admin_margin_pct}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {products.length > 0 && (
        <div className="text-center text-sm text-[#6B7280]">
          {t('common.showing', lang)} {products.length} {t('common.of', lang)} {t('products.title', lang).toLowerCase()} {search || catFilter ? `(${t('products.filtered', lang)})` : ''}
        </div>
      )}
    </div>
  )
}
