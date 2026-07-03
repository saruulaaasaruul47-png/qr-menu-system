import { useEffect, useState } from 'react'
import { QrCode, Mail, Lock, ChefHat, BarChart3, RefreshCw } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { api } from '../lib/api'
import { route } from '../lib/router'

export function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const savedResetEmail = sessionStorage.getItem('resetEmail') || ''
  const savedResetSessionToken = sessionStorage.getItem('resetSessionToken') || ''
  const [recovery, setRecovery] = useState({ email: savedResetEmail, code: '', resetToken: '', resetSessionToken: savedResetSessionToken, newPassword: '' })
  const [registerForm, setRegisterForm] = useState({
    restaurantName: '', ownerName: '', email: '', password: '', phone: '', address: '', plan: 'FREE',
  })

  useEffect(() => {
    queueMicrotask(() => setMessage(''))
  }, [mode])

  const wrap = async (fn) => {
    setLoading(true)
    setMessage('')
    try { await fn() } catch (err) { setMessage(err.message) } finally { setLoading(false) }
  }

  const login = (e) => { e.preventDefault(); wrap(async () => {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(loginForm) })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('restaurantId', data.user.restaurantId || '')
    route('/app')
  }) }

  const register = (e) => { e.preventDefault(); wrap(async () => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        restaurant: { name: registerForm.restaurantName, phone: registerForm.phone || undefined, address: registerForm.address || undefined, themeColor: '#f59e0b' },
        owner: { name: registerForm.ownerName, email: registerForm.email, password: registerForm.password },
        subscription: { plan: registerForm.plan },
      }),
    })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('restaurantId', data.restaurant.id)
    route('/app')
  }) }

  const forgot = (e) => { e.preventDefault(); wrap(async () => {
    const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: recovery.email }), timeoutMs: 35000 })
    sessionStorage.setItem('resetEmail', recovery.email)
    if (data.resetSessionToken) sessionStorage.setItem('resetSessionToken', data.resetSessionToken)
    setRecovery({ ...recovery, resetSessionToken: data.resetSessionToken || '' })
    route('/reset-password')
  }) }

  const verifyCode = (e) => { e.preventDefault(); wrap(async () => {
    const resetSessionToken = recovery.resetSessionToken || sessionStorage.getItem('resetSessionToken') || ''
    const data = await api('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email: recovery.email, code: recovery.code, resetSessionToken }) })
    setRecovery({ ...recovery, resetToken: data.resetToken })
    setMessage('Code verified. Enter a new password.')
  }) }

  const reset = (e) => { e.preventDefault(); wrap(async () => {
    await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken: recovery.resetToken, newPassword: recovery.newPassword }) })
    sessionStorage.removeItem('resetEmail')
    sessionStorage.removeItem('resetSessionToken')
    setMessage('Password changed. You can login now.')
    route('/login')
  }) }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left brand panel */}
      <div className="relative hidden w-[460px] flex-shrink-0 flex-col justify-between overflow-hidden bg-[#0F172A] p-12 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
        />
        <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/[0.07] blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 shadow-lg">
              <QrCode size={19} className="text-slate-900" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">MenuQR</span>
          </div>
          <h2 className="mb-4 text-[32px] font-bold leading-tight text-white">
            The complete restaurant<br />management platform.
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-400">
            QR menus, real-time orders, kitchen ops, and analytics — all unified in one elegant system.
          </p>
        </div>

        <div className="relative space-y-3">
          {[
            { Icon: QrCode, text: 'Instant QR menus — scan, order, pay' },
            { Icon: ChefHat, text: 'Live kitchen display with priority queue' },
            { Icon: BarChart3, text: 'Revenue analytics across all locations' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05]">
                <Icon size={14} className="text-amber-400" />
              </div>
              <span className="text-[13px] text-slate-300">{text}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-white/[0.06] pt-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Realtime modules</div>
            <div className="flex flex-wrap gap-4">
              {['Orders', 'Payments', 'Kitchen'].map((r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-slate-500">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-8 max-sm:p-4">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <QrCode size={16} className="text-amber-400" />
            </div>
            <span className="text-lg font-bold text-slate-900">MenuQR</span>
          </div>

          {isForgot || isReset ? (
            <>
              <h1 className="mb-1 text-[26px] font-bold tracking-tight text-slate-900">
                {isForgot ? 'Forgot password' : 'Reset password'}
              </h1>
              <p className="mb-8 text-sm text-slate-400">
                {isForgot ? 'Enter your email to receive a 6-digit code.' : recovery.resetToken ? 'Enter your new password.' : 'Enter the 6-digit code sent to your email.'}
              </p>
              <form onSubmit={isForgot ? forgot : recovery.resetToken ? reset : verifyCode} className="space-y-4">
                {isForgot && (
                  <Field label="Email address" type="email" icon={Mail} value={recovery.email} onChange={(e) => setRecovery({ ...recovery, email: e.target.value })} placeholder="you@restaurant.com" />
                )}
                {isReset && !recovery.resetToken && (
                  <>
                    <Field label="Email address" type="email" icon={Mail} value={recovery.email} onChange={(e) => setRecovery({ ...recovery, email: e.target.value })} placeholder="you@restaurant.com" />
                    <Field label="6-digit code" value={recovery.code} onChange={(e) => setRecovery({ ...recovery, code: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="123456" />
                  </>
                )}
                {isReset && recovery.resetToken && (
                  <Field label="New password" type="password" icon={Lock} value={recovery.newPassword} onChange={(e) => setRecovery({ ...recovery, newPassword: e.target.value })} />
                )}
                <Button className="w-full" disabled={loading}>
                  {loading ? <><RefreshCw size={14} className="animate-spin" /> Processing…</> : (isForgot ? 'Send code' : recovery.resetToken ? 'Reset password' : 'Verify code')}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => route('/login')}>Back to login</Button>
              </form>
            </>
          ) : (
            <>
              {/* Tabs */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  className={`rounded-lg py-2.5 text-[13px] font-bold transition-all ${!isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => route('/login')}
                >Login</button>
                <button
                  className={`rounded-lg py-2.5 text-[13px] font-bold transition-all ${isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => route('/register')}
                >Register</button>
              </div>

              <h1 className="mb-1 text-[26px] font-bold tracking-tight text-slate-900">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mb-8 text-sm text-slate-400">
                {isRegister ? 'Register your restaurant and start your QR menu.' : 'Sign in to your restaurant dashboard.'}
              </p>

              {!isRegister ? (
                <form onSubmit={login} className="space-y-4">
                  <Field label="Email address" type="email" icon={Mail} value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="owner@restaurant.com" />
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Password</span>
                      <button type="button" className="text-[12px] font-semibold text-amber-600 hover:text-amber-700" onClick={() => route('/forgot-password')}>Forgot password</button>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-400 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-400/15">
                      <Lock size={13} className="flex-shrink-0" />
                      <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <><RefreshCw size={14} className="animate-spin" /> Signing in…</> : 'Sign in to Dashboard'}
                  </button>
                </form>
              ) : (
                <form onSubmit={register} className="space-y-4">
                  <Field label="Restaurant name" value={registerForm.restaurantName} onChange={(e) => setRegisterForm({ ...registerForm, restaurantName: e.target.value })} placeholder="Maison Elara" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Owner name" value={registerForm.ownerName} onChange={(e) => setRegisterForm({ ...registerForm, ownerName: e.target.value })} placeholder="Your name" />
                    <SelectField label="Plan" value={registerForm.plan} onChange={(e) => setRegisterForm({ ...registerForm, plan: e.target.value })}>
                      <option value="FREE">Free</option>
                      <option value="STANDARD">Standard</option>
                      <option value="PREMIUM">Premium</option>
                    </SelectField>
                  </div>
                  <Field label="Email" type="email" icon={Mail} value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="owner@restaurant.com" />
                  <Field label="Password" type="password" icon={Lock} value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="8+ characters" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                    <Field label="Address" value={registerForm.address} onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })} />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <><RefreshCw size={14} className="animate-spin" /> Creating…</> : 'Create account'}
                  </button>
                </form>
              )}
            </>
          )}

          {message && (
            <div className={`mt-4 rounded-xl p-3 text-[13px] font-semibold ${message.includes('sent') || message.includes('changed') || message.includes('verified') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
