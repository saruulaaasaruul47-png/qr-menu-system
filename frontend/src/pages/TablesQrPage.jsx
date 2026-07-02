import { useState } from 'react'
import { QrCode, Download, Printer, Copy, Plus, RefreshCw } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { Modal } from '../components/atoms/Modal'
import { PageHead } from '../components/molecules/PageHead'
import { EmptyState, ErrorState, LoadingState } from '../components/molecules/PageState'
import { StatCard } from '../components/molecules/StatCard'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'

const statusCfg = {
  AVAILABLE: { dot: 'bg-emerald-400', label: 'Available', bg: 'bg-emerald-50', border: 'border-emerald-200', tx: 'text-emerald-700' },
  OCCUPIED:  { dot: 'bg-red-400',     label: 'Occupied',  bg: 'bg-red-50',     border: 'border-red-200',     tx: 'text-red-700'     },
  RESERVED:  { dot: 'bg-amber-400',   label: 'Reserved',  bg: 'bg-amber-50',   border: 'border-amber-200',   tx: 'text-amber-700'   },
}

export function TablesQrPage({ restaurant, refresh, nonce }) {
  const tables = useAsync(() => api('/tables'), [nonce])
  const scans = useAsync(() => api('/qr/scans').catch(() => ({ total: 0 })), [nonce])
  const [form, setForm] = useState({ count: 1, capacity: 2 })
  const [qrModal, setQrModal] = useState(null)

  const create = async (e) => {
    e.preventDefault()
    await api('/tables', { method: 'POST', body: JSON.stringify({ count: Number(form.count), capacity: Number(form.capacity) }) })
    refresh()
  }
  const genQr = async (tableId) => { await api(`/qr/table/${tableId}`); refresh() }
  const genQrRecord = async (tableId) => { await api('/qr', { method: 'POST', body: JSON.stringify({ restaurantId: restaurant?.id, tableId }) }); refresh() }
  const setStatus = async (table, status) => {
    await api(`/tables/${table.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    refresh()
  }
  const remove = async (table) => {
    if (!window.confirm(`Delete table ${table.number || table.name}?`)) return
    await api(`/tables/${table.id}`, { method: 'DELETE' })
    refresh()
  }

  const tableList = tables.data || []

  return (
    <>
      <PageHead
        title="QR Management"
        subtitle="Generate, manage, and track table QR codes"
        actions={
          <>
            <Button variant="outline" size="sm"><Download size={11} /> Bulk Download</Button>
            <Button size="sm" onClick={create}><Plus size={11} /> Add Tables</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total QR Codes" value={tableList.filter((t) => t.qrCodeUrl).length} Icon={QrCode} color="amber" />
        <StatCard label="Total Scans" value={scans.data?.total || 0} Icon={QrCode} color="blue" />
        <StatCard label="Active Tables" value={tableList.length} Icon={QrCode} color="emerald" />
        <StatCard label="Restaurant" value={restaurant?.name || '—'} Icon={QrCode} color="purple" />
      </div>

      {tables.loading && !tables.data && <LoadingState title="Loading tables..." />}
      {tables.error && <ErrorState error={tables.error} />}
      {!tables.loading && !tables.error && !tableList.length && <EmptyState title="No tables yet" text="Add tables to generate QR codes." />}

      {!tables.loading && !tables.error && (
      <Card className="mb-6">
        <form onSubmit={create} className="grid grid-cols-[180px_180px_auto] items-end gap-3 max-md:grid-cols-1">
          <Field label="How many" type="number" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} />
          <Field label="Seats per table" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <Button>Auto add</Button>
        </form>
      </Card>
      )}

      {!tables.loading && !tables.error && !!tableList.length && <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tableList.map((table) => {
          const cfg = statusCfg[table.status] || statusCfg.AVAILABLE
          return (
            <div
              key={table.id}
              className={`group rounded-lg border-2 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-lg ${cfg.border}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">T-{String(table.number || table.name).padStart(2, '0')}</span>
                <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              </div>
              <div className="mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2">
                {table.qrCodeUrl
                  ? <img className="mx-auto h-20 w-20 rounded-lg object-contain" src={table.qrCodeUrl} alt={`QR ${table.name}`} />
                  : <div className="mx-auto grid h-20 w-20 place-items-center text-slate-300"><QrCode size={40} /></div>
                }
              </div>
              <div className="mb-1 text-[13px] font-bold text-slate-900">Table {table.number || table.name}</div>
              <div className="mb-3 text-[11px] text-slate-400">{table.capacity || 1} seats</div>
              <div className={`mb-3 rounded-lg px-2 py-1 text-center text-[10px] font-semibold ${cfg.bg} ${cfg.tx}`}>{cfg.label}</div>
              <div className="grid gap-1.5">
                <Button variant="dark" size="sm" className="w-full justify-center" onClick={() => genQr(table.id)}>
                  <RefreshCw size={10} /> {table.qrCodeUrl ? 'Regenerate' : 'Generate QR'}
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => genQrRecord(table.id)}>
                  <QrCode size={10} /> Create QR
                </Button>
                {table.qrCodeUrl && (
                  <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => setQrModal(table)}>
                    <QrCode size={10} /> View QR
                  </Button>
                )}
                <div className="grid grid-cols-3 gap-1">
                  {['AVAILABLE', 'OCCUPIED', 'RESERVED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(table, s)}
                      className={`rounded-lg px-1 py-1 text-[9px] font-bold transition-colors ${table.status === s ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {s.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <button onClick={() => remove(table)} className="rounded-lg py-1 text-[10px] font-semibold text-red-400 transition-colors hover:bg-red-50">Delete</button>
              </div>
            </div>
          )
        })}
      </div>}

      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title={`QR Code — Table ${qrModal?.number || qrModal?.name}`} width="max-w-sm">
        {qrModal && (
          <div className="text-center">
            <div className="mb-5 inline-block rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6">
              <img src={qrModal.qrCodeUrl} alt="QR code" className="h-40 w-40 rounded-xl" />
            </div>
            <div className="mb-1 text-[14px] font-bold text-slate-900">Table {qrModal.number || qrModal.name}</div>
            <div className="mb-4 text-[11px] text-slate-400">{qrModal.capacity} seats · {qrModal.status}</div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="dark" size="sm" className="justify-center"><Download size={11} /> Save</Button>
              <Button variant="outline" size="sm" className="justify-center"><Printer size={11} /> Print</Button>
              <Button variant="outline" size="sm" className="justify-center" onClick={() => navigator.clipboard?.writeText(qrModal.qrCodeUrl)}><Copy size={11} /> Copy</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
