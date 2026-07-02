import { useEffect, useMemo, useState } from 'react'
import { Store, Clock, DollarSign, Shield, Upload, Globe, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { Toggle } from '../components/atoms/Toggle'
import { PageHead } from '../components/molecules/PageHead'
import { EmptyState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { hasPermission, PERMISSIONS } from '../lib/permissions'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DEFAULT_THEME_COLOR = '#f59e0b'

const restaurantFormFrom = (restaurant) => ({
  name: restaurant?.name || '',
  phone: restaurant?.phone || '',
  address: restaurant?.address || '',
  themeColor: restaurant?.themeColor || DEFAULT_THEME_COLOR,
  logoUrl: restaurant?.logoUrl || '',
  bannerUrl: restaurant?.bannerUrl || '',
})

export function SettingsPage({ restaurant, refresh, user }) {
  const canManageRestaurant = hasPermission(user, PERMISSIONS.MANAGE_RESTAURANT)
  const canManageSubscriptions = hasPermission(user, PERMISSIONS.MANAGE_SUBSCRIPTIONS)
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState(() => restaurantFormFrom(restaurant))
  const [subscription, setSubscription] = useState({ plan: 'FREE', foodLimit: 10, isActive: true, expiresAt: '' })
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' })
  const [hours, setHours] = useState(DAYS.map((d, i) => ({ day: d, open: i !== 6, from: '11:00', to: '22:00' })))
  const [message, setMessage] = useState('')

  useEffect(() => {
    queueMicrotask(() => setForm(restaurantFormFrom(restaurant)))
  }, [restaurant])

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!restaurant?.id) return
    setMessage('')
    try {
      await api(`/restaurants/${restaurant.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      setMessage('Profile saved successfully')
      refresh()
    } catch (err) {
      setMessage(err.message || 'Profile could not be saved')
    }
  }
  const saveSubscription = async (e) => {
    e.preventDefault()
    await api('/subscriptions', {
      method: 'PUT',
      body: JSON.stringify({
        restaurantId: restaurant?.id,
        plan: subscription.plan,
        foodLimit: Number(subscription.foodLimit),
        isActive: subscription.isActive,
        expiresAt: subscription.expiresAt ? new Date(subscription.expiresAt).toISOString() : undefined,
      }),
    })
    refresh()
  }
  const changePassword = async (e) => {
    e.preventDefault()
    await api('/auth/change-password', { method: 'PATCH', body: JSON.stringify(password) })
    setPassword({ currentPassword: '', newPassword: '' })
  }

  const tabs = useMemo(() => [
      { id: 'profile', label: canManageRestaurant ? 'Restaurant Profile' : 'My Account', Icon: Store },
      canManageRestaurant && { id: 'hours', label: 'Business Hours', Icon: Clock },
      canManageSubscriptions && { id: 'subscription', label: 'Subscription', Icon: Shield },
      canManageSubscriptions && { id: 'billing', label: 'Billing', Icon: DollarSign },
    ].filter(Boolean),
    [canManageRestaurant, canManageSubscriptions],
  )

  useEffect(() => {
    if (!tabs.some((item) => item.id === tab)) queueMicrotask(() => setTab(tabs[0]?.id || 'profile'))
  }, [tab, tabs])

  return (
    <>
      <PageHead title="Settings" subtitle="Manage restaurant configuration and preferences" />
      <div className="flex gap-6 max-lg:flex-col">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0 space-y-0.5 max-lg:flex max-lg:w-full max-lg:flex-wrap max-lg:gap-2 max-lg:space-y-0">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all max-lg:w-auto ${
                tab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
              }`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {!tabs.length && <EmptyState title="No settings available" text="This role does not have editable settings." />}
          {tab === 'profile' && (
            <Card>
              {message && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-[12px] font-bold ${message.includes('successfully') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                  {message}
                </div>
              )}
              {canManageRestaurant && (
                <>
                  <h3 className="m-0 mb-5 text-[13px] font-bold text-slate-900">Restaurant Profile</h3>
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                      {form.logoUrl
                        ? <img src={form.logoUrl} alt="logo" className="h-full w-full rounded-2xl object-cover" />
                        : <Store size={22} className="text-slate-300" />
                      }
                    </div>
                    <div>
                      <Button variant="outline" size="sm"><Upload size={11} /> Upload Logo</Button>
                      <p className="mt-1 text-[11px] text-slate-400">PNG, JPG up to 2MB · Recommended 400×400</p>
                    </div>
                  </div>
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <Field label="Restaurant Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      <Field label="Theme Color" type="color" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} />
                    </div>
                    <Field label="Address" icon={MapPin} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <Field label="Phone" icon={Phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      <Field label="Website / Banner URL" icon={Globe} value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} />
                    </div>
                    <Field label="Logo URL" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
                    <div className="flex justify-end pt-2"><Button>Save Profile</Button></div>
                  </form>
                </>
              )}
              <div className={canManageRestaurant ? 'mt-6 border-t border-slate-100 pt-5' : ''}>
                <h4 className="mb-3 text-[12px] font-bold text-slate-700">Change Password</h4>
                <form onSubmit={changePassword} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 max-md:grid-cols-1">
                  <Field label="Current Password" type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} />
                  <Field label="New Password" type="password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} />
                  <Button>Change</Button>
                </form>
              </div>
            </Card>
          )}

          {tab === 'hours' && (
            <Card>
              <h3 className="m-0 mb-5 text-[13px] font-bold text-slate-900">Business Hours</h3>
              <div className="space-y-1">
                {hours.map((h, i) => (
                  <div key={h.day} className="flex items-center gap-4 border-b border-slate-50 py-3 last:border-0">
                    <div className="w-28 text-[13px] font-semibold text-slate-700">{h.day}</div>
                    <Toggle
                      label=""
                      checked={h.open}
                      onChange={(v) => setHours((hs) => hs.map((hh, j) => j === i ? { ...hh, open: v } : hh))}
                    />
                    <span className="w-12 text-[12px] text-slate-400">{h.open ? 'Open' : 'Closed'}</span>
                    {h.open && (
                      <>
                        <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-700 outline-none focus:border-amber-400">
                          {['09:00', '10:00', '11:00', '12:00'].map((v) => <option key={v}>{v}</option>)}
                        </select>
                        <span className="text-slate-400">to</span>
                        <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-700 outline-none focus:border-amber-400">
                          {['21:00', '22:00', '23:00', '00:00'].map((v) => <option key={v}>{v}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end"><Button>Save Hours</Button></div>
            </Card>
          )}

          {tab === 'subscription' && (
            <div className="space-y-4">
              <div className="rounded-[18px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">Current Plan</div>
                    <h2 className="text-[22px] font-black text-white">{restaurant?.subscription?.plan || 'FREE'}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-[13px] font-black text-slate-900">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-900" /> Active
                  </div>
                </div>
                <form onSubmit={saveSubscription} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                    <SelectField label="Plan" value={subscription.plan} onChange={(e) => setSubscription({ ...subscription, plan: e.target.value })}>
                      {['FREE', 'STANDARD', 'PREMIUM'].map((p) => <option key={p}>{p}</option>)}
                    </SelectField>
                    <Field label="Food limit" value={subscription.foodLimit} onChange={(e) => setSubscription({ ...subscription, foodLimit: e.target.value })} />
                    <Field label="Expires at" type="datetime-local" value={subscription.expiresAt} onChange={(e) => setSubscription({ ...subscription, expiresAt: e.target.value })} />
                  </div>
                  <Toggle label="Active" checked={subscription.isActive} onChange={(v) => setSubscription({ ...subscription, isActive: v })} />
                  <Button>Save Subscription</Button>
                </form>
                <div className="mt-4 space-y-1">
                  {['Unlimited restaurants & tables', 'Custom QR design', 'Priority support 24/7', 'Advanced analytics API'].map((f) => (
                    <div key={f} className="flex items-center gap-2 py-1 text-[12px] text-slate-400">
                      <CheckCircle2 size={12} className="flex-shrink-0 text-emerald-400" />{f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <Card>
              <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Stripe Billing</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const session = await api('/payments/stripe/checkout', { method: 'POST', body: JSON.stringify({ restaurantId: restaurant?.id, planKey: 'MONTHLY' }) })
                    if (session?.url) window.location.href = session.url
                  }}
                >
                  Monthly Plan — Stripe
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const session = await api('/payments/stripe/checkout', { method: 'POST', body: JSON.stringify({ restaurantId: restaurant?.id, planKey: 'YEARLY' }) })
                    if (session?.url) window.location.href = session.url
                  }}
                >
                  Yearly Plan — Stripe
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
