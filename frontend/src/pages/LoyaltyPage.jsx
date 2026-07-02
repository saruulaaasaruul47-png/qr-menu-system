import { useState } from 'react'
import { Phone, Star, Gift, Trash2 } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { PageHead } from '../components/molecules/PageHead'
import { EmptyState } from '../components/molecules/PageState'
import { api } from '../lib/api'

export function LoyaltyPage({ restaurantId }) {
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [privateResult, setPrivateResult] = useState(null)
  const [points, setPoints] = useState({ amount: '', paymentId: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const lookup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const [publicLookup, ownerLookup] = await Promise.all([
        api(`/loyalty/public?restaurantId=${restaurantId}&phone=${encodeURIComponent(phone)}`),
        api(`/loyalty?restaurantId=${restaurantId}&phone=${encodeURIComponent(phone)}`),
      ])
      setResult(publicLookup)
      setPrivateResult(ownerLookup)
    }
    catch (err) { setResult(null); setPrivateResult(null); setMessage(err.message) } finally { setLoading(false) }
  }
  const addPoints = async () => {
    setMessage('')
    await api('/loyalty/points', { method: 'POST', body: JSON.stringify({ restaurantId, phone: phone || undefined, amount: Number(points.amount), paymentId: points.paymentId || undefined }) })
    setPoints({ amount: '', paymentId: '' })
    if (phone) { const res = await api(`/loyalty/public?restaurantId=${restaurantId}&phone=${encodeURIComponent(phone)}`); setResult(res) }
  }
  const deleteData = async () => {
    if (!phone || !window.confirm('Delete loyalty data for this phone?')) return
    await api('/loyalty/personal-data', { method: 'DELETE', body: JSON.stringify({ restaurantId, phone }) })
    setResult(null)
    setPrivateResult(null)
  }

  const prog = result ? Math.min(100, ((result.points || 0) / 500) * 100) : 0

  return (
    <>
      <PageHead title="Loyalty" subtitle="Phone-based guest loyalty — no customer login required" />

      {message && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</div>}

      <div className="mb-5 grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Lookup Customer</h3>
          <form onSubmit={lookup} className="grid gap-3">
            <Field label="Phone number" icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+976 9900 0000" />
            <Button disabled={loading}>{loading ? 'Looking up…' : 'Lookup loyalty'}</Button>
          </form>
          {result && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold text-slate-900">{phone}</div>
                <Badge tone={result.eligibleForDiscount ? 'success' : 'slate'}>{result.eligibleForDiscount ? 'Reward eligible' : 'Building points'}</Badge>
              </div>
              <div className="mb-2 flex items-center gap-4 text-center">
                <div className="flex-1 rounded-xl bg-white p-2.5">
                  <div className="text-[18px] font-black text-slate-900">{result.points || 0}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Points</div>
                </div>
                <div className="flex-1 rounded-xl bg-white p-2.5">
                  <div className="text-[18px] font-black text-slate-900">{result.visitCount || 0}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visits</div>
                </div>
                <div className="flex-1 rounded-xl bg-white p-2.5">
                  <Star size={16} className="mx-auto fill-amber-400 text-amber-400" />
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mt-1">Level</div>
                </div>
              </div>
              <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                <span>{result.points || 0} pts</span><span>500 pts for reward</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${prog}%` }} />
              </div>
            </div>
          )}
          {privateResult && (
            <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-[12px] text-slate-500">
              <b className="text-slate-700">Owner view</b>
              <div>Customer ID: {privateResult.id || privateResult.customerId || 'Existing loyalty record'}</div>
              <div>Updated: {privateResult.updatedAt ? new Date(privateResult.updatedAt).toLocaleString() : 'Just now'}</div>
            </div>
          )}
          {!loading && !result && !message && (
            <div className="mt-4">
              <EmptyState title="No loyalty lookup yet" text="Search by phone number to see points and visits." />
            </div>
          )}
        </Card>

        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Add Points</h3>
          <div className="grid gap-3">
            <Field label="Points amount" value={points.amount} onChange={(e) => setPoints({ ...points, amount: e.target.value })} placeholder="e.g. 50" />
            <Field label="Payment ID (optional)" value={points.paymentId} onChange={(e) => setPoints({ ...points, paymentId: e.target.value })} />
            <Button onClick={addPoints}><Gift size={12} /> Add points</Button>
            <Button variant="outline" onClick={deleteData} className="text-red-500 hover:border-red-200 hover:bg-red-50">
              <Trash2 size={12} /> Delete personal data
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
