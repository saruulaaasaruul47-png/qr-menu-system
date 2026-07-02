import { useState } from 'react'
import { Plus, Mail, User, Edit2, UserX, Trash2, Search } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { Modal } from '../components/atoms/Modal'
import { PageHead } from '../components/molecules/PageHead'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'

const roleTone = { MANAGER: 'purple', WAITER: 'blue', KITCHEN: 'orange', CASHIER: 'green', HOST: 'pink' }

function initials(name) {
  return (name || 'XX').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const avatarColors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500']
function avatarColor(name) { return avatarColors[(name || '').charCodeAt(0) % avatarColors.length] }

export function EmployeesPage({ restaurantId, refresh, nonce }) {
  const data = useAsync(() => api('/employees'), [nonce])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'WAITER' })
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const create = async (e) => {
    e.preventDefault()
    await api('/employees', { method: 'POST', body: JSON.stringify({ ...form, restaurantId }) })
    setForm({ name: '', email: '', password: '', role: 'WAITER' })
    setShowAdd(false)
    refresh()
  }
  const update = async (item) => {
    const role = window.prompt('Role', item.role)
    if (!role) return
    await api(`/employees/${item.id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    refresh()
  }
  const deactivate = async (item) => {
    await api(`/employees/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) })
    refresh()
  }
  const remove = async (item) => {
    if (!window.confirm(`Delete employee ${item.name}?`)) return
    await api(`/employees/${item.id}`, { method: 'DELETE' })
    refresh()
  }

  const all = (data.data || []).filter((e) => e.isActive !== false)
  const roles = ['all', 'MANAGER', 'WAITER', 'KITCHEN', 'CASHIER']
  const filtered = all.filter((e) => {
    const ms = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
    const mr = roleFilter === 'all' || e.role === roleFilter
    return ms && mr
  })

  return (
    <>
      <PageHead
        title="Employees"
        subtitle={`${all.length} team members`}
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus size={11} /> Add Employee</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="max-w-xs flex-1">
          <Field icon={Search} placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all ${roleFilter === r ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {data.loading && !data.data ? <LoadingState title="Loading employees..." /> : data.error ? <ErrorState error={data.error} /> : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Employee', 'Role', 'Restaurant', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${avatarColor(e.name)}`}>
                      {initials(e.name)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">{e.name}</div>
                      <div className="text-[11px] text-slate-400">{e.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><Badge tone={roleTone[e.role] || 'slate'}>{e.role}</Badge></td>
                <td className="px-5 py-3.5 text-[13px] text-slate-500">{e.restaurant?.name || '—'}</td>
                <td className="px-5 py-3.5"><Badge tone={e.isActive === false ? 'danger' : 'success'}>{e.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => update(e)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Edit role"><Edit2 size={12} /></button>
                    <button onClick={() => deactivate(e)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-amber-50 hover:text-amber-600" title="Deactivate"><UserX size={12} /></button>
                    <button onClick={() => remove(e)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!data.loading && !data.error && !filtered.length && <Empty title="No employees found" />}
        {!data.loading && !data.error && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
          <span className="text-[12px] text-slate-400">Showing {filtered.length} of {all.length} employees</span>
        </div>}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee">
        <form onSubmit={create} className="space-y-4">
          <Field label="Full Name" icon={User} placeholder="e.g. Sophia Marchetti" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Email Address" type="email" icon={Mail} placeholder="employee@restaurant.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Field label="Password" type="password" placeholder="8+ characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {['MANAGER', 'WAITER', 'KITCHEN', 'CASHIER'].map((r) => <option key={r}>{r}</option>)}
          </SelectField>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="dark" className="flex-1">Add Employee</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
