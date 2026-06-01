'use client'
import { useState, useEffect } from 'react'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const { lang } = useLang()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sapkey_user')
      if (raw) setUser(JSON.parse(raw))
      else setUser({ name_ar: 'مدير النظام', email: 'admin@sapkey.com', role: 'admin', password: 'default' })
    } catch {}
  }, [])

  function changePassword() {
    if (!newPassword || newPassword.length < 4) { setMessage(`❌ ${t('settings.passMinLength', lang)}`); return }
    if (newPassword !== confirmPassword) { setMessage(`❌ ${t('settings.passMismatch', lang)}`); return }
    const raw = localStorage.getItem('sapkey_user')
    if (raw) {
      const u = JSON.parse(raw)
      u.password = newPassword
      localStorage.setItem('sapkey_user', JSON.stringify(u))
    }
    setMessage(`✅ ${t('settings.passSuccess', lang)}`)
    setNewPassword(''); setConfirmPassword('')
  }

  if (!user) return <div className="flex justify-center py-16"><div className="loading-spinner w-8 h-8" /></div>

  return (
    <div className="space-y-6 animate-in" style={{ maxWidth: 600 }}>
      <h1 className="text-2xl font-bold">{t('settings.title', lang)}</h1>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">{t('settings.profile', lang)}</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0" style={{ background: user.role === 'admin' ? 'rgba(14,203,129,0.2)' : 'rgba(30,128,255,0.2)', color: user.role === 'admin' ? '#0ECB81' : '#1E80FF' }}>
              {user.name_ar?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{user.name_ar}</div>
              <div className="text-sm text-[#9CA3AF] truncate">{user.email}</div>
              <span className={`badge ${user.role === 'admin' ? 'badge-green' : 'badge-blue'} text-xs`}>
                {user.role === 'admin' ? t('settings.adminRole', lang) : t('settings.accRole', lang)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">{t('settings.changePassword', lang)}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-1">{t('settings.newPassword', lang)}</label>
            <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('settings.newPassword', lang)} />
          </div>
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-1">{t('settings.confirmPassword', lang)}</label>
            <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('settings.confirmPassword', lang)} />
          </div>
          <button className="btn-primary" onClick={changePassword}>{t('settings.savePassword', lang)}</button>
          {message && (
            <div className={`text-sm p-2 rounded-lg ${message.startsWith('✅') ? 'bg-[#0ECB81]/10 text-[#0ECB81]' : 'bg-[#F6465D]/10 text-[#F6465D]'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">{t('settings.systemInfo', lang)}</h2>
        <div className="space-y-2 text-sm text-[#9CA3AF]">
          <div className="flex justify-between"><span>{t('settings.version', lang)}</span><span>SAPKEY ERP v2.0.0</span></div>
          <div className="flex justify-between"><span>{t('settings.database', lang)}</span><span>localStorage</span></div>
          <div className="flex justify-between"><span>{t('settings.mode', lang)}</span><span className="badge-green">{t('settings.secure', lang)}</span></div>
        </div>
      </div>
    </div>
  )
}
