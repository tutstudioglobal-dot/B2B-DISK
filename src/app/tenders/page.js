'use client'
import { useState, useEffect } from 'react'
import { calculateComprehensivePricing } from '@/lib/pricing'
import { useLang } from '@/context/LangContext'
import { t, tArr } from '@/lib/i18n'

export default function TendersPage() {
  const [tenders, setTenders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [calcTender, setCalcTender] = useState(null)
  const [calcInputs, setCalcInputs] = useState({ basePrice: 0, contingency: 2, shipping: 0, other: 0, margin: 25, tax: 3 })
  const [calcResult, setCalcResult] = useState(null)
  const [editIdx, setEditIdx] = useState(-1)
  const [formData, setFormData] = useState({ client: '', project: '', amount: '', deadline: '' })
  const { lang } = useLang()

  const STEPS = tArr(t('tenders.steps', 'ar'), 'ar').map((_, i) => t('tenders.steps', lang)[i] || t('tenders.steps', 'ar')[i])
  const STEPS_DATA = t('tenders.steps', lang)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sapkey_next_store')
      const store = raw ? JSON.parse(raw) : {}
      setTenders(store.tenders || [])
    } catch {}
  }, [])

  function saveTenders(newTenders) {
    setTenders(newTenders)
    try {
      const store = JSON.parse(localStorage.getItem('sapkey_next_store') || '{}')
      store.tenders = newTenders
      localStorage.setItem('sapkey_next_store', JSON.stringify(store))
    } catch {}
  }

  function addTender() {
    if (!formData.client.trim()) return alert(t('common.error', lang) || 'Enter client name')
    const t = {
      id: `TDR-${Date.now()}`,
      client_ar: formData.client, projectName_ar: formData.project,
      amount: +formData.amount || 0, myBidAmt: 0,
      step: 1, status: STEPS_DATA?.[0]?.[lang] || STEPS_DATA?.[0]?.ar || '',
      deadline: formData.deadline, result: null,
      expense: null, finalCalcPrice: null,
    }
    if (editIdx >= 0) { tenders[editIdx] = t; saveTenders([...tenders]) }
    else saveTenders([...tenders, t])
    setShowForm(false); setEditIdx(-1)
    setFormData({ client: '', project: '', amount: '', deadline: '' })
  }

  function advanceTender(idx, targetStep) {
    const t = [...tenders]
    if (t[idx].step >= 10) return
    if (targetStep <= t[idx].step) return
    if (targetStep === 3 && t[idx].step >= 2) {
      setCalcTender(idx)
      setCalcInputs({
        basePrice: t[idx].myBidAmt || t[idx].amount,
        contingency: t[idx].expense?.contingencyPct || 2,
        shipping: t[idx].expense?.shippingCost || 0,
        other: t[idx].expense?.otherExpenses || 0,
        margin: t[idx].expense?.adminMarginPct || 25,
        tax: t[idx].expense?.govTaxPct || 3,
      })
      setShowCalc(true); return
    }
    t[idx].step = Math.min(targetStep, 10)
    t[idx].status = targetStep >= 10 ? 'closed' : (STEPS_DATA?.[targetStep - 1]?.[lang] || '')
    saveTenders(t)
  }

  function saveExpenseAndAdvance() {
    const r = calculateComprehensivePricing(calcInputs.basePrice, calcInputs.margin, {
      contingencyPct: calcInputs.contingency, shippingCost: calcInputs.shipping,
      otherExpenses: calcInputs.other, governmentTaxesPct: calcInputs.tax,
    })
    setCalcResult(r)
    const t = [...tenders]
    if (calcTender >= 0 && calcTender < t.length) {
      t[calcTender].expense = {
        contingencyPct: calcInputs.contingency, shippingCost: calcInputs.shipping,
        otherExpenses: calcInputs.other, adminMarginPct: calcInputs.margin, govTaxPct: calcInputs.tax,
      }
      t[calcTender].finalCalcPrice = r.finalPriceForClient
      t[calcTender].step = 4
      t[calcTender].status = STEPS_DATA?.[3]?.[lang] || 'pricing'
      saveTenders(t)
    }
    setShowCalc(false); setCalcTender(null)
  }

  function deleteTender(idx) {
    if (!window.confirm(t('tenders.deleteConfirm', lang))) return
    const updated = tenders.filter((_, i) => i !== idx)
    saveTenders(updated)
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('tenders.title', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{t('tenders.subtitle', lang)}</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => { setFormData({ client: '', project: '', amount: '', deadline: '' }); setEditIdx(-1); setShowForm(true) }}>
          <i className="fas fa-plus ms-1"></i> {t('tenders.addTender', lang)}
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editIdx >= 0 ? t('common.edit', lang) : t('tenders.addTender', lang)}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('tenders.client', lang)}</label><input className="input" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} /></div>
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('tenders.project', lang)}</label><input className="input" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('common.amount', lang)}</label><input className="input" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('tenders.deadline', lang)}</label><input className="input" type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} /></div>
              </div>
              <button className="btn-primary w-full" onClick={addTender}>{t('common.save', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {showCalc && (
        <div className="modal-overlay" onClick={() => { setShowCalc(false); setCalcTender(null) }}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('tenders.expenseCalc', lang)}</h2>
              <button onClick={() => { setShowCalc(false); setCalcTender(null) }} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.baseCost', lang)}</label><input className="input" type="number" value={calcInputs.basePrice} onChange={e => setCalcInputs({...calcInputs, basePrice: +e.target.value})} /></div>
              <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.profitMargin', lang)}</label><input className="input" type="number" value={calcInputs.margin} onChange={e => setCalcInputs({...calcInputs, margin: +e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.shipping', lang)}</label><input className="input" type="number" value={calcInputs.shipping} onChange={e => setCalcInputs({...calcInputs, shipping: +e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.contingency', lang)}</label><input className="input" type="number" value={calcInputs.contingency} onChange={e => setCalcInputs({...calcInputs, contingency: +e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.otherExpenses', lang)}</label><input className="input" type="number" value={calcInputs.other} onChange={e => setCalcInputs({...calcInputs, other: +e.target.value})} /></div>
                <div><label className="block text-sm text-[#9CA3AF] mb-1">{t('products.tax', lang)}</label><input className="input" type="number" value={calcInputs.tax} onChange={e => setCalcInputs({...calcInputs, tax: +e.target.value})} /></div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={saveExpenseAndAdvance}><i className="fas fa-check ms-1"></i> {t('tenders.applyPricing', lang)}</button>
                <button className="btn-outline" onClick={() => { const r = calculateComprehensivePricing(calcInputs.basePrice, calcInputs.margin, { contingencyPct: calcInputs.contingency, shippingCost: calcInputs.shipping, otherExpenses: calcInputs.other, governmentTaxesPct: calcInputs.tax }); setCalcResult(r) }}><i className="fas fa-calculator"></i></button>
              </div>
              {calcResult && (
                <div className="p-3 bg-[#0E0E1A] rounded-xl">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>{t('products.baseCost', lang)}</span><span>{calcResult.baseCost?.toLocaleString()} {t('common.egp', lang)}</span></div>
                    <div className="flex justify-between"><span>{t('products.finalPrice', lang)}</span><span className="text-[#0ECB81] font-bold">{calcResult.finalPriceForClient.toLocaleString()} {t('common.egp', lang)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tenders.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><i className="fas fa-helmet-safety"></i></div>
          <div className="text">{t('common.noData', lang)}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {tenders.map((t, i) => {
            const color = t.result === 'won' ? '#0ECB81' : t.result === 'lost' ? '#F6465D' : '#A66CFF'
            return (
              <div key={t.id} className="card animate-in" style={{ borderTop: `3px solid ${color}` }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{t.id}</span>
                    <span className="text-sm text-[#9CA3AF]">{lang === 'ar' ? t.client_ar : t.client_en || t.client_ar}</span>
                    {t.result === 'won' && <span className="badge-green text-xs"><i className="fas fa-trophy ms-1"></i>{t('tenders.won', lang)}</span>}
                    {t.result === 'lost' && <span className="badge-red text-xs"><i className="fas fa-times ms-1"></i>{t('tenders.lost', lang)}</span>}
                  </div>
                  <span className="font-bold">{t.myBidAmt?.toLocaleString() || t.amount?.toLocaleString()} {t('common.egp', lang)}</span>
                </div>
                <div className="text-sm text-[#9CA3AF] mb-2">{lang === 'ar' ? t.projectName_ar : t.projectName_en || t.projectName_ar}</div>

                <div className="stepper">
                  {STEPS.map((s, si) => {
                    const stepNum = si + 1
                    const state = stepNum <= t.step ? 'done' : stepNum === t.step + 1 ? 'current' : 'pending'
                    if (t.status === 'closed' && stepNum < 10 && state === 'current') return null
                    return (
                      <button key={si} className={`step ${state}`} onClick={() => advanceTender(i, stepNum)}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border shrink-0" style={{ borderColor: 'currentColor' }}>
                          {state === 'done' ? <i className="fas fa-check text-[10px]"></i> : stepNum}
                        </span>
                        <span className="hidden sm:inline">{STEPS_DATA?.[si]?.[lang] || s}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2A2A3E] flex-wrap">
                  {t.step === 1 && <button className="btn-primary text-xs" onClick={() => advanceTender(i, 2)}><i className="fas fa-file-invoice ms-1"></i>{t('tenders.submitOffer', lang)}</button>}
                  {t.step === 4 && <button className="btn-secondary text-xs" onClick={() => advanceTender(i, 5)}><i className="fas fa-paper-plane ms-1"></i>{t('tenders.submitOffer', lang)}</button>}
                  <button className="btn-outline text-xs" onClick={() => { setFormData({ client: t.client_ar, project: t.projectName_ar, amount: String(t.amount || ''), deadline: t.deadline || '' }); setEditIdx(i); setShowForm(true) }}>
                    <i className="fas fa-pen ms-1"></i>{t('common.edit', lang)}
                  </button>
                  {!t.result && (
                    <>
                      <button className="badge-green text-xs cursor-pointer border-none" onClick={() => { const updated = [...tenders]; updated[i].result = 'won'; saveTenders(updated) }}>
                        <i className="fas fa-check ms-1"></i>{t('tenders.won', lang)}
                      </button>
                      <button className="badge-red text-xs cursor-pointer border-none" onClick={() => { const updated = [...tenders]; updated[i].result = 'lost'; updated[i].step = 10; updated[i].status = 'closed'; saveTenders(updated) }}>
                        <i className="fas fa-times ms-1"></i>{t('tenders.lost', lang)}
                      </button>
                    </>
                  )}
                  <button className="text-xs text-[#F6465D] hover:text-[#ff7a8d] bg-transparent border-none cursor-pointer" onClick={() => deleteTender(i)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
