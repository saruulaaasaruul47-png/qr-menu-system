import { useState } from 'react'
import { Plus, Filter, MapPin, Phone, Edit2, Trash2 } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Field } from '../components/atoms/Field'
import { Modal } from '../components/atoms/Modal'
import { PageHead } from '../components/molecules/PageHead'
import { EmptyState, ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { hasPermission, PERMISSIONS, ROLES } from '../lib/permissions'

export function RestaurantsPage({ refresh, nonce, user }) {
  const data = useAsync(() => api('/restaurants'), [nonce])
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)
  const [message, setMessage] = useState('')
  const canManageAll = hasPermission(user, PERMISSIONS.MANAGE_ALL_RESTAURANTS)
  const canEditRestaurant = user?.role !== ROLES.SUPER_ADMIN && hasPermission(user, PERMISSIONS.MANAGE_RESTAURANT)

  const openDetail = async (item) => {
    setMessage('')
    try { setDetail(await api(`/restaurants/${item.id}`)) }
    catch (err) { setMessage(err.message) }
  }

  const create = async (e) => {
    e.preventDefault()
    await api('/restaurants', { method: 'POST', body: JSON.stringify(form) })
    setForm({ name: '', phone: '', address: '' })
    setShowCreate(false)
    refresh()
  }
  const update = async (item) => {
    const name = window.prompt('Restaurant name', item.name)
    if (!name) return
    await api(`/restaurants/${item.id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
    refresh()
  }
  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return
    await api(`/restaurants/${item.id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <>
      <PageHead
        title="Restaurants"
        subtitle={`${(data.data || []).length} locations across the portfolio`}
        actions={
          <>
            <Button variant="outline" size="sm"><Filter size={11} /> Filter</Button>
            {canManageAll && (
              <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={11} /> Add Location</Button>
            )}
          </>
        }
      />
      {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>}

      {data.loading && !data.data && <LoadingState title="Loading restaurants..." />}
      {data.error && <ErrorState error={data.error} />}
      {!data.loading && !data.error && !(data.data || []).length && <EmptyState title="No restaurants yet" text="Create the first location to start using the dashboard." />}
      {!data.loading && !data.error && !!(data.data || []).length && <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {(data.data || []).map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="relative h-48 overflow-hidden bg-slate-200">
              {item.bannerUrl
                ? <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" src={item.bannerUrl} alt={item.name} />
                : <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,#fbbf24_0,#f59e0b_22%,#0f172a_70%)]" />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-3 top-3">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${item.isActive === false ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {item.isActive === false ? 'inactive' : 'active'}
                </span>
              </div>
              <div className="absolute bottom-4 left-4">
                <h3 className="text-base font-bold leading-tight text-white">{item.name}</h3>
                <p className="mt-0.5 text-[12px] text-white/60">{item.description || 'Restaurant location'}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Tables', value: item._count?.tables ?? '-' },
                  { label: 'Staff', value: item._count?.employees ?? '-' },
                  { label: 'Plan', value: item.subscription?.plan || 'FREE' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                    <div className="text-[15px] font-bold text-slate-900">{value}</div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mb-4 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><MapPin size={11} />{item.address || 'No address'}</span>
                <span className="flex items-center gap-1"><Phone size={11} />{item.phone || 'No phone'}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openDetail(item)}>
                  Details
                </Button>
                {canEditRestaurant && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => update(item)}>
                    <Edit2 size={11} /> Edit
                  </Button>
                )}
                {canManageAll && (
                  <button
                    onClick={() => remove(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Restaurant" width="max-w-xl">
        <form onSubmit={create} className="space-y-4">
          <Field label="Restaurant Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maison Elara" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" icon={Phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+976 99..." />
            <Field label="Address" icon={MapPin} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="dark" className="flex-1">Create Restaurant</Button>
          </div>
        </form>
      </Modal>
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || 'Restaurant'} width="max-w-xl">
        {detail && (
          <div className="grid gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><b>Phone</b><div>{detail.phone || 'Not set'}</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><b>Address</b><div>{detail.address || 'Not set'}</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><b>Plan</b><div>{detail.subscription?.plan || 'FREE'}</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><b>Status</b><div>{detail.isActive === false ? 'Inactive' : 'Active'}</div></div>
          </div>
        )}
      </Modal>
    </>
  )
}
