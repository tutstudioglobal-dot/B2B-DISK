'use client'
import { useState, useEffect } from 'react'
import { useLang } from '@/context/LangContext'
import { calculateComprehensivePricing } from '@/lib/pricing'
import { t, tArr } from '@/lib/i18n'
import { syncDSCompletion, deductInventory, getInventory } from '@/lib/supabase'

export default function DirectSupplyPage() {
  const { lang } = useLang()
  const STEPS = tArr(t('ds.steps', 'ar'), 'ar').map((_, i) => t('ds.steps', lang)[i] || t('ds.steps', 'ar')[i])
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showOCR, setShowOCR] = useState(null)
  const [formData, setFormData] = useState({ client: '', project: '', amount: '', date: '', dsItems: [] })
  const [inventoryList, setInventoryList] = useState([])
  const [pricingInputs, setPricingInputs] = useState({ cost: 0, margin: 25, shipping: 0, other: 0, contingency: 2, tax: 3 })
  const [pricingResult, setPricingResult] = useState(null)
  const [pricingItemIdx, setPricingItemIdx] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sapkey_next_store')
      const store = raw ? JSON.parse(raw) : {}
      setItems(store.direct_supply || [])
    } catch {}
    getInventory().then(setInventoryList)
  }, [])

  function saveItems(newItems) {
    setItems(newItems)
    try {
      const store = JSON.parse(localStorage.getItem('sapkey_next_store') || '{}')
      store.direct_supply = newItems
      localStorage.setItem('sapkey_next_store', JSON.stringify(store))
    } catch {}
  }

  function addItem() {
    if (!formData.client.trim()) return
    const ds = {
      id: `DS-${Date.now()}`,
      client_ar: formData.client,
      project: formData.project,
      amount: +formData.amount || 0,
      date: formData.date || new Date().toISOString().slice(0, 10),
      step: 1,
      items: formData.dsItems.length ? formData.dsItems : [{ name: lang === 'ar' ? 'منتج' : 'Product', qty: 1, price: 0 }],
      pricing: null,
      status: STEPS[0],
      invoice: null,
      collection: null,
    }
    saveItems([...items, ds])
    setShowForm(false)
    setFormData({ client: '', project: '', amount: '', date: '', dsItems: [] })
  }

  function advanceStep(idx) {
    const updated = [...items]
    if (updated[idx].step >= 6) return
    if (updated[idx].step === 2) {
      setPricingItemIdx(idx)
      const p = updated[idx].pricing
      setPricingInputs({
        cost: p?.cost || 0,
        margin: p?.margin || 25,
        shipping: p?.shipping || 0,
        other: p?.other || 0,
        contingency: p?.contingency || 2,
        tax: p?.tax || 3,
      })
      setShowPricing(true)
      return
    }
    if (updated[idx].step === 3) {
      if (!window.confirm(lang === 'ar' ? 'تأكيد استلام الفاتورة؟' : 'Confirm invoice receipt?')) return
      updated[idx].invoice = { date: new Date().toISOString().slice(0, 10), amount: updated[idx].amount }
    }
    if (updated[idx].step === 4) {
      if (!window.confirm(lang === 'ar' ? 'تسجيل التحصيل؟' : 'Record collection?')) return
      updated[idx].collection = { date: new Date().toISOString().slice(0, 10), amount: updated[idx].amount }
    }
    if (updated[idx].step === 5) {
      if (!window.confirm(lang === 'ar' ? 'إغلاق الطلب؟' : 'Close order?')) return
      deductInventory(updated[idx].items || [])
      syncDSCompletion(updated[idx])
    }
    updated[idx].step += 1
    updated[idx].status = updated[idx].step >= 6 ? STEPS[5] : STEPS[updated[idx].step - 1]
    saveItems(updated)
  }

  function applyPricing() {
    const r = calculateComprehensivePricing(pricingInputs.cost, pricingInputs.margin, {
      contingencyPct: pricingInputs.contingency, shippingCost: pricingInputs.shipping,
      otherExpenses: pricingInputs.other, governmentTaxesPct: pricingInputs.tax,
    })
    setPricingResult(r)
    if (pricingItemIdx !== null) {
      const updated = [...items]
      updated[pricingItemIdx].pricing = { ...pricingInputs, result: r }
      updated[pricingItemIdx].amount = r.finalPriceForClient
      updated[pricingItemIdx].step = 3
      updated[pricingItemIdx].status = STEPS[2]
      saveItems(updated)
    }
  }

  function deleteItem(idx) {
    if (!window.confirm(lang === 'ar' ? 'حذف طلب التوريد المباشر؟' : 'Delete direct supply request?')) return
    saveItems(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
            <h1 className="text-2xl font-bold">{t('ds.title', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{t('ds.subtitle', lang)}</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus ms-1"></i> {t('ds.addRequest', lang)}
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('ds.addRequest', lang)}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('ds.client', lang)}</label><input className="input" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} /></div>
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('ds.project', lang)}</label><input className="input" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('common.amount', lang)}</label><input className="input" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('common.date', lang)}</label><input className="input" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              </div>
              <button className="btn-primary w-full" onClick={addItem}>{t('common.save', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {showPricing && (
        <div className="modal-overlay" onClick={() => { setShowPricing(false); setPricingItemIdx(null) }}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('ds.pricingTitle', lang)}</h2>
              <button onClick={() => { setShowPricing(false); setPricingItemIdx(null) }} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.baseCost', lang)}</label><input className="input" type="number" value={pricingInputs.cost} onChange={e => setPricingInputs({...pricingInputs, cost: +e.target.value})} /></div>
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.profitMargin', lang)}</label><input className="input" type="number" value={pricingInputs.margin} onChange={e => setPricingInputs({...pricingInputs, margin: +e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.shipping', lang)}</label><input className="input" type="number" value={pricingInputs.shipping} onChange={e => setPricingInputs({...pricingInputs, shipping: +e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.contingency', lang)}</label><input className="input" type="number" value={pricingInputs.contingency} onChange={e => setPricingInputs({...pricingInputs, contingency: +e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.otherExpenses', lang)}</label><input className="input" type="number" value={pricingInputs.other} onChange={e => setPricingInputs({...pricingInputs, other: +e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.tax', lang)}</label><input className="input" type="number" value={pricingInputs.tax} onChange={e => setPricingInputs({...pricingInputs, tax: +e.target.value})} /></div>
              </div>
              <button className="btn-primary w-full" onClick={applyPricing}>{t('ds.applyToItem', lang)}</button>
              {pricingResult && (
                <div className="p-3 bg-[#0E0E1A] rounded-xl">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('products.finalPrice', lang)}</span>
                    <span className="text-[#0ECB81]">{pricingResult.finalPriceForClient.toLocaleString()} {t('common.egp', lang)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showOCR !== null && (
        <div className="modal-overlay" onClick={() => setShowOCR(null)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('ds.ocrTitle', lang)}</h2>
              <button onClick={() => setShowOCR(null)} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="py-8 text-center text-[#9CA3AF]">
              <i className="fas fa-camera text-4xl mb-4 opacity-30"></i>
              <p className="text-sm">{t('ds.ocrDesc', lang)}</p>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><i className="fas fa-truck"></i></div>
          <div className="text">{t('ds.noData', lang)}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((ds, i) => (
            <div key={ds.id} className="card animate-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{ds.id}</span>
                  <span className="text-sm text-[#9CA3AF]">{ds.client_ar}</span>
                  {ds.step >= 6 && <span className="badge-green text-xs"><i className="fas fa-check ms-1"></i>{t('ds.steps', lang)[5] || 'Completed'}</span>}
                </div>
                <span className="font-bold">{ds.amount?.toLocaleString()} {t('common.egp', lang)}</span>
              </div>
              <div className="text-sm text-[#9CA3AF] mb-2">{ds.project}</div>

              <div className="stepper mb-3">
                {STEPS.map((s, si) => {
                  const stepNum = si + 1
                  const state = stepNum <= ds.step ? 'done' : stepNum === ds.step + 1 ? 'current' : 'pending'
                  return (
                    <button key={si} className={`step ${state}`} onClick={() => advanceStep(i)}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border shrink-0" style={{ borderColor: 'currentColor' }}>
                        {state === 'done' ? <i className="fas fa-check text-[10px]"></i> : stepNum}
                      </span>
                      <span className="hidden sm:inline">{s}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2A2A3E] flex-wrap">
                {ds.step < 6 && (
                  <button className="btn-primary text-xs" onClick={() => advanceStep(i)}>
                    <i className={`fas ${ds.step === 2 ? 'fa-calculator' : 'fa-arrow-right'} ms-1`}></i>
                    {ds.step === 1 ? t('ds.pricing', lang) : ds.step === 2 ? t('ds.recordSupply', lang) : ds.step === 3 ? t('ds.issueInvoice', lang) : ds.step === 4 ? t('ds.recordCollection', lang) : ds.step === 5 ? t('ds.close', lang) : ''}
                  </button>
                )}
                <button className="btn-outline text-xs" onClick={() => setShowOCR(i)}>
                  <i className="fas fa-camera ms-1"></i>{t('ds.scanOCR', lang)}
                </button>
                {ds.step >= 3 && ds.invoice && (
                  <span className="text-xs text-[#0ECB81]"><i className="fas fa-file-invoice ms-1"></i>{ds.invoice.date}</span>
                )}
                {ds.step >= 5 && ds.collection && (
                  <span className="text-xs text-[#1E80FF]"><i className="fas fa-coins ms-1"></i>{ds.collection.date}</span>
                )}
                <button className="text-xs text-[#F6465D] hover:text-[#ff7a8d] bg-transparent border-none cursor-pointer" onClick={() => deleteItem(i)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
