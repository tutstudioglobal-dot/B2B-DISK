'use client'
import { useState, useEffect, useCallback } from 'react'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import {
  loadAccountingData, getJE, getTrialData, getBalanceData,
  getDepreciationData, getNotesData, getSettings, addJournalEntry,
  recalculateAll, getBalClose, COA, getAccName,
} from '@/lib/accounting-data'

export default function AccountingPage() {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [data, setData] = useState(null)
  const [entryForm, setEntryForm] = useState({ date: new Date().toISOString().slice(0, 10), ref: '', desc: '', lines: [{ account: '', debit: 0, credit: 0 }] })

  const TABS = [
    { id: 'dashboard', label: t('accounting.tabs.dashboard', lang), icon: 'fa-gauge-high' },
    { id: 'entries', label: t('accounting.tabs.entries', lang), icon: 'fa-book' },
    { id: 'coa', label: t('accounting.tabs.coa', lang), icon: 'fa-sitemap' },
    { id: 'trial', label: t('accounting.tabs.trial', lang), icon: 'fa-scale-balanced' },
    { id: 'income', label: t('accounting.tabs.income', lang), icon: 'fa-chart-line' },
    { id: 'balance', label: t('accounting.tabs.balance', lang), icon: 'fa-file-invoice' },
    { id: 'depreciation', label: t('accounting.tabs.depreciation', lang), icon: 'fa-chart-simple' },
    { id: 'notes', label: t('accounting.tabs.notes', lang), icon: 'fa-sticky-note' },
    { id: 'ledger', label: t('accounting.tabs.ledger', lang), icon: 'fa-book-open' },
  ]

  useEffect(() => {
    loadAccountingData()
    recalculateAll()
    setData({
      JE: [...getJE()],
      trialData: JSON.parse(JSON.stringify(getTrialData())),
      balanceData: JSON.parse(JSON.stringify(getBalanceData())),
      depreciationData: JSON.parse(JSON.stringify(getDepreciationData())),
      notesData: JSON.parse(JSON.stringify(getNotesData())),
      settings: { ...getSettings() },
    })
  }, [lang])

  const refresh = useCallback(() => {
    recalculateAll()
    setData({
      JE: [...getJE()],
      trialData: JSON.parse(JSON.stringify(getTrialData())),
      balanceData: JSON.parse(JSON.stringify(getBalanceData())),
      depreciationData: JSON.parse(JSON.stringify(getDepreciationData())),
      notesData: JSON.parse(JSON.stringify(getNotesData())),
      settings: { ...getSettings() },
    })
  }, [])

  if (!data) return <div className="flex justify-center py-16"><div className="loading-spinner w-8 h-8" /></div>

  function handleAddEntry() {
    const lines = entryForm.lines.filter(l => l.account && (l.debit > 0 || l.credit > 0))
    if (!lines.length) return
    const totalDr = lines.reduce((s, l) => s + l.debit, 0)
    const totalCr = lines.reduce((s, l) => s + l.credit, 0)
    if (Math.abs(totalDr - totalCr) > 0.01) { alert(lang === 'ar' ? '❌ يجب أن يتساوى طرفا القيد (مدين = دائن)' : '❌ Debit and credit must be equal'); return }
    addJournalEntry({
      id: `J${String(data.JE.length + 1).padStart(3, '0')}`,
      date: entryForm.date,
      ref: entryForm.ref || `J${String(data.JE.length + 1).padStart(3, '0')}`,
      desc: entryForm.desc,
      lines,
    })
    refresh()
    setEntryForm({ date: new Date().toISOString().slice(0, 10), ref: '', desc: '', lines: [{ account: '', debit: 0, credit: 0 }] })
  }

  function addLine() {
    setEntryForm(f => ({ ...f, lines: [...f.lines, { account: '', debit: 0, credit: 0 }] }))
  }

  function updateLine(idx, field, value) {
    const lines = [...entryForm.lines]
    lines[idx] = { ...lines[idx], [field]: field === 'account' ? value : +value }
    setEntryForm(f => ({ ...f, lines }))
  }

  function removeLine(idx) {
    if (entryForm.lines.length <= 1) return
    setEntryForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }))
  }

  function trialClass(row) {
    if (row.isSection) return 'bg-[#1A1A2E] font-bold text-[#9CA3AF]'
    if (row.isNetIncome) return 'bg-[#0ECB81]/10 font-bold text-[#0ECB81]'
    if (row.isGrandTotal) return 'bg-[#1E80FF]/10 font-bold text-[#1E80FF] border-t-2 border-[#1E80FF]'
    if (row.isTotal) return 'bg-[#1A1A2E] font-bold text-[#F0A90B]'
    return ''
  }

  function balanceClass(row) {
    if (row.isHeader) return 'bg-[#1A1A2E] font-bold text-lg text-[#A66CFF]'
    if (row.isSubHeader) return 'bg-[#1A1A2E] font-bold text-[#9CA3AF]'
    if (row.isGrandTotal) return 'bg-[#0ECB81]/10 font-bold text-[#0ECB81] border-t-2 border-[#0ECB81]'
    if (row.isTotal) return 'bg-[#1A1A2E] font-bold text-[#F0A90B]'
    if (row.isSubTotal) return 'bg-[#1A1A2E] font-bold'
    return ''
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard()
      case 'entries': return renderEntries()
      case 'coa': return renderCOA()
      case 'trial': return renderTrial()
      case 'income': return renderIncome()
      case 'balance': return renderBalance()
      case 'depreciation': return renderDepreciation()
      case 'notes': return renderNotes()
      case 'ledger': return renderLedger()
      default: return null
    }
  }

  function getMetrics() {
    const td = data.trialData
    const r = id => td.find(row => row.id === id)
    const totalAssets = r(10) ? getBalClose(r(10)).dr : 0
    const totalLiab = r(17) ? getBalClose(r(17)).cr : 0
    const ni = r(20) ? r(20).openCr - r(20).openDr : 0
    const equity = r(21) ? getBalClose(r(21)).cr : 0
    const revenue = r(25) ? r(25).movCr - r(25).movDr : 0
    const expenses = r(29) ? r(29).movDr - r(29).movCr : 0
    return { totalAssets, totalLiab, equity, ni, revenue, expenses }
  }

  function renderDashboard() {
    const m = getMetrics()
    const cards = [
      { label: t('accounting.dashboard.totalAssets', lang), value: m.totalAssets, color: '#0ECB81', icon: 'fa-building-columns' },
      { label: t('accounting.dashboard.totalLiab', lang), value: m.totalLiab, color: '#F6465D', icon: 'fa-credit-card' },
      { label: t('accounting.dashboard.equity', lang), value: m.equity, color: '#1E80FF', icon: 'fa-scale-balanced' },
      { label: t('accounting.dashboard.netIncome', lang), value: m.ni, color: '#F0A90B', icon: 'fa-chart-line' },
      { label: t('accounting.dashboard.revenue', lang), value: m.revenue, color: '#0ECB81', icon: 'fa-arrow-trend-up' },
      { label: t('accounting.dashboard.expenses', lang), value: m.expenses, color: '#F6465D', icon: 'fa-arrow-trend-down' },
    ]
    return (
      <div className="space-y-6 animate-in">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((card, i) => (
            <div key={i} className="card stat-card p-4 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E]">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-2" style={{ background: `${card.color}20` }}>
                <i className={`fas ${card.icon}`} style={{ color: card.color }}></i>
              </div>
              <div className="value text-lg" style={{ color: card.color }}>{card.value.toLocaleString()} {t('common.egp', lang)}</div>
              <div className="label text-xs">{card.label}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-3">{t('accounting.title', lang)}</h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">{t('accounting.dashboard.desc', lang)}</p>
        </div>
      </div>
    )
  }

  function renderEntries() {
    return (
      <div className="space-y-4 animate-in">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">{t('accounting.entries.newEntry', lang)}</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-[#9CA3AF] mb-1">{t('accounting.entries.date', lang)}</label><input className="input" type="date" value={entryForm.date} onChange={e => setEntryForm(f => ({...f, date: e.target.value}))} /></div>
              <div><label className="block text-xs text-[#9CA3AF] mb-1">{t('accounting.entries.reference', lang)}</label><input className="input" value={entryForm.ref} onChange={e => setEntryForm(f => ({...f, ref: e.target.value}))} placeholder={t('accounting.entries.reference', lang)} /></div>
              <div><label className="block text-xs text-[#9CA3AF] mb-1">{t('accounting.entries.description', lang)}</label><input className="input" value={entryForm.desc} onChange={e => setEntryForm(f => ({...f, desc: e.target.value}))} placeholder={t('accounting.entries.description', lang)} /></div>
            </div>
            <div className="table-wrap scroll-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="w-1/2">{t('accounting.entries.account', lang)}</th>
                    <th>{t('accounting.entries.debit', lang)}</th>
                    <th>{t('accounting.entries.credit', lang)}</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {entryForm.lines.map((line, i) => (
                    <tr key={i}>
                      <td>
                        <select className="input w-full" value={line.account} onChange={e => updateLine(i, 'account', e.target.value)}>
                          <option value="">{t('accounting.entries.selectAccount', lang)}</option>
                          {COA.map(acc => (
                            <option key={acc.code} value={acc.code}>{acc.code} — {acc.name_ar}</option>
                          ))}
                        </select>
                      </td>
                      <td><input className="input" type="number" value={line.debit || ''} onChange={e => updateLine(i, 'debit', e.target.value)} min="0" /></td>
                      <td><input className="input" type="number" value={line.credit || ''} onChange={e => updateLine(i, 'credit', e.target.value)} min="0" /></td>
                      <td>
                        <button className="text-[#F6465D] hover:text-[#ff7a8d] bg-transparent border-none cursor-pointer text-sm" onClick={() => removeLine(i)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline text-sm" onClick={addLine}><i className="fas fa-plus ms-1"></i>{t('accounting.entries.addLine', lang)}</button>
              <button className="btn-primary text-sm" onClick={handleAddEntry}><i className="fas fa-save ms-1"></i>{t('accounting.entries.save', lang)}</button>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-4">{t('accounting.entries.entriesList', lang)} ({data.JE.length})</h2>
          <div className="space-y-3">
            {data.JE.slice().reverse().map(je => (
              <div key={je.id} className="bg-[#0E0E1A] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2 text-xs text-[#9CA3AF]">
                  <span className="font-bold text-white">{je.id}</span>
                  <span>{je.date}</span>
                  <span>{je.desc}</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#6B7280]">
                      <th className="text-right pb-1">{t('accounting.entries.account', lang)}</th>
                      <th className="text-right pb-1">{t('accounting.entries.debit', lang)}</th>
                      <th className="text-right pb-1">{t('accounting.entries.credit', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {je.lines.map((line, li) => (
                      <tr key={li}>
                        <td>{getAccName(line.account)}</td>
                        <td className="text-[#0ECB81]">{line.debit > 0 ? line.debit.toLocaleString() : ''}</td>
                        <td className="text-[#F6465D]">{line.credit > 0 ? line.credit.toLocaleString() : ''}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[#2A2A3E] font-bold">
                      <td>{t('accounting.entries.total', lang)}</td>
                      <td className="text-[#0ECB81]">{je.lines.reduce((s, l) => s + l.debit, 0).toLocaleString()}</td>
                      <td className="text-[#F6465D]">{je.lines.reduce((s, l) => s + l.credit, 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderCOA() {
    const groups = [
      { key: 'asset_current', label: t('accounting.coa.assetCurrent', lang), cat: 'asset', sub: 'current' },
      { key: 'asset_noncurrent', label: t('accounting.coa.assetNoncurrent', lang), cat: 'asset', sub: 'noncurrent' },
      { key: 'liability_current', label: t('accounting.coa.liabilityCurrent', lang), cat: 'liability', sub: 'current' },
      { key: 'liability_noncurrent', label: t('accounting.coa.liabilityNoncurrent', lang), cat: 'liability', sub: 'noncurrent' },
      { key: 'equity', label: t('accounting.coa.equity', lang), cat: 'equity', sub: '' },
      { key: 'revenue', label: t('accounting.coa.revenue', lang), cat: 'revenue', sub: '' },
      { key: 'expense_cogs', label: t('accounting.coa.expenseCogs', lang), cat: 'expense', sub: 'cogs' },
      { key: 'expense_admin', label: t('accounting.coa.expenseAdmin', lang), cat: 'expense', sub: 'admin' },
      { key: 'expense_marketing', label: t('accounting.coa.expenseMarketing', lang), cat: 'expense', sub: 'marketing' },
      { key: 'expense_financial', label: t('accounting.coa.expenseFinancial', lang), cat: 'expense', sub: 'financial' },
      { key: 'expense_depreciation', label: t('accounting.coa.expenseDepreciation', lang), cat: 'expense', sub: 'depreciation' },
      { key: 'expense_other', label: t('accounting.coa.expenseOther', lang), cat: 'expense', sub: 'other' },
    ]
    return (
      <div className="space-y-4 animate-in">
        {groups.map(g => {
          const accounts = COA.filter(a => a.cat === g.cat && a.sub === g.sub)
          if (!accounts.length) return null
          return (
            <div key={g.key} className="card">
              <h3 className="text-sm font-bold text-[#A66CFF] mb-2">{g.label} ({accounts.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {accounts.map(acc => (
                  <div key={acc.code} className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-[#0E0E1A]">
                    <span className="font-mono text-[#6B7280] w-16">{acc.code}</span>
                    <span>{acc.name_ar}</span>
                    {acc.contra && <span className="badge text-[8px] bg-[#F6465D]/20 text-[#F6465D]">{t('accounting.coa.contra', lang)}</span>}
                    {acc.netIncome && <span className="badge text-[8px] bg-[#0ECB81]/20 text-[#0ECB81]">{t('accounting.coa.netIncome', lang)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderTrial() {
    return (
      <div className="space-y-4 animate-in">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-xs" style={{ minWidth: 900 }}>
            <thead>
              <tr className="bg-[#1A1A2E]">
                <th className="p-2 text-right w-8">#</th>
                <th className="p-2 text-right">{t('accounting.entries.description', lang)}</th>
                <th className="p-2 text-center" colSpan="2">{t('accounting.trial.openingBal', lang)}</th>
                <th className="p-2 text-center" colSpan="2">{t('accounting.trial.movement', lang)}</th>
                <th className="p-2 text-center" colSpan="2">{t('accounting.trial.settlement', lang)}</th>
                <th className="p-2 text-center" colSpan="2">{t('accounting.trial.closingBal', lang)}</th>
              </tr>
              <tr className="bg-[#1A1A2E] text-[#6B7280]">
                <th></th><th></th>
                <th className="p-1 text-center">{t('accounting.entries.debit', lang)}</th><th className="p-1 text-center">{t('accounting.entries.credit', lang)}</th>
                <th className="p-1 text-center">{t('accounting.entries.debit', lang)}</th><th className="p-1 text-center">{t('accounting.entries.credit', lang)}</th>
                <th className="p-1 text-center">{t('accounting.entries.debit', lang)}</th><th className="p-1 text-center">{t('accounting.entries.credit', lang)}</th>
                <th className="p-1 text-center">{t('accounting.entries.debit', lang)}</th><th className="p-1 text-center">{t('accounting.entries.credit', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {data.trialData.map(row => {
                const bc = getBalClose(row)
                return (
                  <tr key={row.id} className={`${trialClass(row)} border-b border-[#2A2A3E]`}>
                    <td className="p-2 text-[#6B7280]">{row.id}</td>
                    <td className="p-2" style={{ paddingInlineStart: row.isTotal || row.isGrandTotal || row.isNetIncome ? 8 : row.isSection ? 8 : 24 }}>{row.name_ar}</td>
                    <td className="p-2 text-center font-mono">{row.openDr > 0 ? row.openDr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono">{row.openCr > 0 ? row.openCr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono">{row.movDr > 0 ? row.movDr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono">{row.movCr > 0 ? row.movCr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono">{row.adjDr > 0 ? row.adjDr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono">{row.adjCr > 0 ? row.adjCr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono text-[#0ECB81]">{bc.dr > 0 ? bc.dr.toLocaleString() : ''}</td>
                    <td className="p-2 text-center font-mono text-[#F6465D]">{bc.cr > 0 ? bc.cr.toLocaleString() : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderIncome() {
    const td = data.trialData
    const r = id => td.find(x => x.id === id)
    const revenue = r(25) ? r(25).movCr - r(25).movDr : 0
    const expenses = r(29) ? r(29).movDr - r(29).movCr : 0
    const netIncome = revenue - expenses
    return (
      <div className="space-y-4 animate-in" style={{ maxWidth: 600 }}>
        <div className="card border border-[#2A2A3E]">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{t('accounting.income.title', lang)}</h2>
            <p className="text-xs text-[#9CA3AF]">{t('accounting.income.forPeriod', lang)} {data.settings.fiscalYear}</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-[#1A1A2E]"><td className="p-2 font-bold" colSpan="2">{t('accounting.income.revenue', lang)}</td></tr>
              <tr className="border-b border-[#2A2A3E]">
                <td className="p-2 pr-8">{t('accounting.income.revenueActivity', lang)}</td>
                <td className="p-2 text-left font-mono text-[#0ECB81]">{revenue.toLocaleString()}</td>
              </tr>
              <tr className="bg-[#1A1A2E]"><td className="p-2 font-bold" colSpan="2">{t('accounting.income.expenses', lang)}</td></tr>
              <tr className="border-b border-[#2A2A3E]">
                <td className="p-2 pr-8">{t('accounting.income.totalExpenses', lang)}</td>
                <td className="p-2 text-left font-mono text-[#F6465D]">({expenses.toLocaleString()})</td>
              </tr>
              <tr className="border-t-2 border-[#0ECB81] bg-[#0ECB81]/5">
                <td className="p-2 font-bold text-[#0ECB81]">{t('accounting.income.netIncome', lang)}</td>
                <td className="p-2 text-left font-bold font-mono text-[#0ECB81]">{netIncome.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderBalance() {
    return (
      <div className="space-y-4 animate-in" style={{ maxWidth: 600 }}>
        <div className="card border border-[#2A2A3E]">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{t('accounting.balance.title', lang)}</h2>
            <p className="text-xs text-[#9CA3AF]">{t('accounting.balance.asOf', lang)} {data.settings.fiscalYear}</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {data.balanceData.map((row, i) => (
                <tr key={i} className={`${balanceClass(row)} border-b border-[#2A2A3E]`}>
                  <td className="p-2" style={{ paddingInlineStart: row.indent ? row.indent * 12 : 8 }}>
                    {row.label_ar}
                    {row.isHeader && <i className="fas fa-minus ms-2 text-[10px]"></i>}
                  </td>
                  <td className="p-2 text-left font-mono whitespace-nowrap">
                    {!row.isHeader && !row.isSubHeader ? `${row.amt2023.toLocaleString()} ${t('common.egp', lang)}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderDepreciation() {
    return (
      <div className="space-y-4 animate-in" style={{ maxWidth: 700 }}>
        <div className="card border border-[#2A2A3E]">
          <h2 className="text-lg font-bold mb-4">{t('accounting.depreciation.title', lang)}</h2>
          <div className="table-wrap scroll-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1A1A2E]">
                  <th className="p-2 text-right">{t('accounting.depreciation.asset', lang)}</th>
                  <th className="p-2 text-center">{t('accounting.depreciation.cost', lang)}</th>
                  <th className="p-2 text-center">{t('accounting.depreciation.rate', lang)}</th>
                  <th className="p-2 text-center">{t('accounting.depreciation.usefulLife', lang)}</th>
                  <th className="p-2 text-center">{t('accounting.depreciation.annualDep', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {data.depreciationData.map((d, i) => {
                  const annual = d.cost * d.rate_acc / 100
                  return (
                    <tr key={i} className="border-b border-[#2A2A3E]">
                      <td className="p-2">{d.asset_ar}</td>
                      <td className="p-2 text-center font-mono">{d.cost.toLocaleString()}</td>
                      <td className="p-2 text-center">{d.rate_acc}%</td>
                      <td className="p-2 text-center">{d.years} {t('accounting.depreciation.year', lang)}</td>
                      <td className="p-2 text-center font-mono text-[#F0A90B]">{annual.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#1A1A2E] font-bold">
                  <td className="p-2">{t('accounting.depreciation.total', lang)}</td>
                  <td className="p-2 text-center">{data.depreciationData.reduce((s, d) => s + d.cost, 0).toLocaleString()}</td>
                  <td></td>
                  <td></td>
                  <td className="p-2 text-center text-[#0ECB81]">{data.depreciationData.reduce((s, d) => s + (d.cost * d.rate_acc / 100), 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderNotes() {
    return (
      <div className="space-y-4 animate-in" style={{ maxWidth: 700 }}>
        {data.notesData.map(note => (
          <div key={note.id} className="card border border-[#2A2A3E]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#A66CFF]/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#A66CFF]">{note.id}</span>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">{note.title_ar}</h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{note.content_ar}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderLedger() {
    const JE = data.JE
    const accountBalances = {}
    COA.forEach(acc => {
      const lines = JE.flatMap(je =>
        je.lines.filter(l => l.account === acc.code).map(l => ({ ...l, date: je.date, ref: je.id, desc: je.desc }))
      )
      if (!lines.length) return
      let bal = 0
      const rows = lines.map(l => {
        bal += l.debit - l.credit
        return { ...l, runningBal: bal }
      })
      accountBalances[acc.code] = { name: acc.name_ar, rows }
    })

    const codes = Object.keys(accountBalances)
    return (
      <div className="space-y-4 animate-in">
        {codes.map(code => {
          const ab = accountBalances[code]
          return (
            <div key={code} className="card border border-[#2A2A3E]">
              <h3 className="text-sm font-bold text-[#A66CFF] mb-2">{code} — {ab.name}</h3>
              <div className="table-wrap scroll-wrap">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1A1A2E]">
                      <th className="p-1 text-right">{t('accounting.ledger.date', lang)}</th>
                      <th className="p-1 text-right">{t('accounting.ledger.reference', lang)}</th>
                      <th className="p-1 text-right">{t('accounting.ledger.description', lang)}</th>
                      <th className="p-1 text-center">{t('accounting.ledger.debit', lang)}</th>
                      <th className="p-1 text-center">{t('accounting.ledger.credit', lang)}</th>
                      <th className="p-1 text-center">{t('accounting.ledger.balance', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ab.rows.map((r, i) => (
                      <tr key={i} className="border-b border-[#2A2A3E]">
                        <td className="p-1">{r.date}</td>
                        <td className="p-1 font-mono">{r.ref}</td>
                        <td className="p-1">{r.desc}</td>
                        <td className="p-1 text-center font-mono text-[#0ECB81]">{r.debit > 0 ? r.debit.toLocaleString() : ''}</td>
                        <td className="p-1 text-center font-mono text-[#F6465D]">{r.credit > 0 ? r.credit.toLocaleString() : ''}</td>
                        <td className={`p-1 text-center font-mono font-bold ${r.runningBal >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                          {r.runningBal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {codes.length === 0 && (
          <div className="empty-state">
            <div className="icon"><i className="fas fa-book-open"></i></div>
            <div className="text">{t('accounting.ledger.noData', lang)}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('accounting.title', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{data.settings.companyName} — {data.settings.fiscalYear}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-[#1A1A2E] rounded-xl p-1 border border-[#2A2A3E] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'text-[#6B7280] hover:text-white bg-transparent'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fas ${tab.icon} ms-1`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  )
}
