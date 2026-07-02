import { useState } from 'react'
import { CreditCard, Wallet, Search, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { PageHead } from '../components/molecules/PageHead'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { money } from '../lib/format'
import { useAsync } from '../hooks/useAsync'

const statusTone = { SUCCESS: 'success', PENDING: 'warning', FAILED: 'danger', REFUNDED: 'purple' }

export function PaymentsPage({ restaurantId, refresh, nonce }) {
  const data = useAsync(() => api('/payments'), [nonce])
  const orders = useAsync(() => restaurantId ? api(`/orders?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId, nonce])
  const [form, setForm] = useState({ orderId: '', provider: 'DEMO', autoResolve: true })
  const [statusId, setStatusId] = useState('')
  const [status, setStatus] = useState(null)
  const [detail, setDetail] = useState(null)
  const [webhook, setWebhook] = useState({ provider: 'demo', paymentId: '', status: 'SUCCESS', transactionId: '' })
  const [message, setMessage] = useState('')

  const create = async (e) => {
    e.preventDefault()
    setMessage('')
    if (form.provider === 'DEMO') await api('/payments/demo/create', { method: 'POST', body: JSON.stringify({ orderId: form.orderId, provider: 'DEMO', autoResolve: form.autoResolve }) })
    else await api('/payments', { method: 'POST', body: JSON.stringify({ orderId: form.orderId, provider: form.provider }) })
    setForm({ orderId: '', provider: 'DEMO', autoResolve: true })
    refresh()
  }
  const demoAction = async (payment, action) => {
    setMessage('')
    await api(`/payments/demo/${action}/${payment.id}`, { method: 'POST' })
    refresh()
  }
  const lookup = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const [nextStatus, nextDetail] = await Promise.all([
        api(`/payments/${statusId}/status`),
        api(`/payments/${statusId}`),
      ])
      setStatus(nextStatus)
      setDetail(nextDetail)
    } catch (err) {
      setMessage(err.message)
    }
  }
  const sendWebhook = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const payment = await api(`/payments/webhooks/${webhook.provider}`, {
        method: 'POST',
        body: JSON.stringify({
          paymentId: webhook.paymentId,
          status: webhook.status,
          transactionId: webhook.transactionId || undefined,
        }),
      })
      setMessage(`Webhook accepted: ${payment.status}`)
      refresh()
    } catch (err) {
      setMessage(err.message)
    }
  }
  const stripeOrder = async () => {
    if (!form.orderId) return
    const session = await api('/payments/stripe/order-checkout', { method: 'POST', body: JSON.stringify({ orderId: form.orderId }) })
    if (session?.url) window.location.href = session.url
  }

  const openBills = (orders.data || []).filter((order) => ['READY', 'SERVED'].includes(order.status))

  return (
    <>
      <PageHead title="Payments" subtitle="Cashier desk, open bills and payment verification" />
      {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>}
      {((data.loading && !data.data) || (orders.loading && !orders.data)) && <LoadingState title="Loading payments..." />}
      {(data.error || orders.error) && <ErrorState error={data.error || orders.error} />}
      {!data.loading && !orders.loading && !data.error && !orders.error && (
      <>

      <div className="mb-5 grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Open Bills</h3>
          {openBills.length ? (
            <div className="grid gap-2">
              {openBills.slice(0, 6).map((order) => (
                <div key={order.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="grid h-10 min-w-10 place-items-center rounded-xl bg-slate-900 px-2 text-[14px] font-black text-white">
                    {order.table?.number || order.table?.name || '-'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-slate-900">Table {order.table?.number || order.table?.name || '-'}</div>
                    <div className="text-[11px] text-slate-400">{order.status} · #{order.id?.slice(0, 8)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-black text-slate-900">{money(order.totalAmount)}</div>
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, orderId: order.id }))}
                      className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Use order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty title="No open bills" />}
        </Card>

        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Create Payment</h3>
          <form onSubmit={create} className="grid gap-3">
            <Field label="Order ID" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} />
            <SelectField label="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
              {['DEMO', 'QPay', 'SocialPay', 'MonPay', 'Card'].map((p) => <option key={p}>{p}</option>)}
            </SelectField>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
              <input type="checkbox" checked={form.autoResolve} onChange={(e) => setForm({ ...form, autoResolve: e.target.checked })} className="accent-amber-400" />
              Auto resolve demo payment
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button><CreditCard size={12} /> Create payment</Button>
              <Button type="button" variant="outline" onClick={stripeOrder}><Wallet size={12} /> Stripe checkout</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Status Lookup</h3>
          <form onSubmit={lookup} className="grid gap-3">
            <Field label="Payment ID" icon={Search} value={statusId} onChange={(e) => setStatusId(e.target.value)} placeholder="Enter payment ID…" />
            <Button variant="outline">Lookup status</Button>
          </form>
          {status && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-slate-900">{status.invoiceNo || status.id}</div>
                  <div className="text-[11px] text-slate-400">{status.provider}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-black text-slate-900">{money(status.amount)}</div>
                  <Badge tone={statusTone[status.status] || 'slate'}>{status.status}</Badge>
                </div>
              </div>
            </div>
          )}
          {detail && (
            <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-[12px] text-slate-500">
              <div><b className="text-slate-700">Order:</b> {detail.orderId}</div>
              <div><b className="text-slate-700">Invoice:</b> {detail.invoiceUrl || 'Not generated'}</div>
              <div><b className="text-slate-700">Transaction:</b> {detail.transactionId || 'Pending'}</div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Webhook Simulator</h3>
          <form onSubmit={sendWebhook} className="grid gap-3">
            <Field label="Payment ID" value={webhook.paymentId} onChange={(e) => setWebhook({ ...webhook, paymentId: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider" value={webhook.provider} onChange={(e) => setWebhook({ ...webhook, provider: e.target.value })} />
              <SelectField label="Status" value={webhook.status} onChange={(e) => setWebhook({ ...webhook, status: e.target.value })}>
                {['SUCCESS', 'FAILED', 'REFUNDED'].map((s) => <option key={s}>{s}</option>)}
              </SelectField>
            </div>
            <Field label="Transaction ID" value={webhook.transactionId} onChange={(e) => setWebhook({ ...webhook, transactionId: e.target.value })} />
            <Button variant="outline">Send webhook</Button>
          </form>
        </Card>
      </div>

      <Card>
        <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">All Payments</h3>
        {(data.data || []).length ? (
          <div className="grid gap-2">
            {(data.data || []).map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${p.status === 'SUCCESS' ? 'bg-emerald-50' : p.status === 'FAILED' ? 'bg-red-50' : 'bg-slate-100'}`}>
                  {p.status === 'SUCCESS' ? <CheckCircle2 size={16} className="text-emerald-500" /> : p.status === 'FAILED' ? <XCircle size={16} className="text-red-500" /> : <CreditCard size={16} className="text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-900">{p.invoiceNo || p.id?.slice(0, 12)}</div>
                  <div className="text-[11px] text-slate-400">{p.provider} · {new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-black text-slate-900">{money(p.amount)}</div>
                  <Badge tone={statusTone[p.status] || 'slate'}>{p.status}</Badge>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setStatusId(p.id); setWebhook({ ...webhook, paymentId: p.id }) }} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100">Use ID</button>
                  {p.provider === 'DEMO' && (
                    <>
                      <button onClick={() => demoAction(p, 'confirm')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100">Confirm</button>
                      <button onClick={() => demoAction(p, 'fail')} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100">Fail</button>
                      <button onClick={() => demoAction(p, 'refund')} className="rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700 hover:bg-purple-100">Refund</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : <Empty title="No payments yet" />}
      </Card>
      </>
      )}
    </>
  )
}
