import { useState } from 'react'
import { Plus, ChefHat, Volume2, VolumeX, CheckCircle2, Bell, CheckCheck } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Modal } from '../components/atoms/Modal'
import { PageHead } from '../components/molecules/PageHead'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { OrderRow } from '../components/molecules/OrderRow'
import { api } from '../lib/api'
import { money } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { orderStatuses } from '../constants/navigation'
import { ROLES } from '../lib/permissions'

const statusTone = { PENDING: 'warning', ACCEPTED: 'info', PREPARING: 'info', READY: 'success', SERVED: 'green', COMPLETED: 'slate', CANCELLED: 'danger' }
const serviceRequestTypes = new Set(['CALL_WAITER', 'REQUEST_WATER', 'REQUEST_CUTLERY', 'REQUEST_BILL', 'CLEAN_TABLE', 'WAITER', 'BILL'])
const serviceRequestLabels = {
  CALL_WAITER: 'Call waiter',
  REQUEST_WATER: 'Water',
  REQUEST_CUTLERY: 'Cutlery',
  REQUEST_BILL: 'Bill',
  CLEAN_TABLE: 'Clean table',
}

export function OrdersPage({ restaurantId, refresh, nonce, user, kitchen = false }) {
  const data = useAsync(() => restaurantId ? api(`/orders?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId, nonce])
  const notifications = useAsync(
    () => user?.role === ROLES.WAITER ? api('/notifications').catch(() => []) : Promise.resolve([]),
    [nonce, user?.role],
  )
  const [filter, setFilter] = useState('all')
  const [sound, setSound] = useState(() => localStorage.getItem('notificationSound') !== 'off')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')

  const update = async (order, status) => {
    await api(`/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    refresh()
  }
  const showDetail = async (order) => {
    setMessage('')
    try { setSelected(await api(`/orders/${order.id}`)) }
    catch (err) { setMessage(err.message) }
  }
  const markNotificationRead = async (notification) => {
    await api(`/notifications/${notification.id}/read`, { method: 'PATCH' })
    refresh()
  }
  const toggleSound = () => {
    const nextSound = !sound
    setSound(nextSound)
    localStorage.setItem('notificationSound', nextSound ? 'on' : 'off')
    window.dispatchEvent(new Event('notification-sound-change'))
  }
  const visible = (data.data || []).filter((o) => filter === 'all' || o.status === filter)

  if (data.loading && !data.data) return <LoadingState title={kitchen ? 'Loading kitchen display...' : 'Loading orders...'} />
  if (data.error) return <ErrorState error={data.error} />

  // Kitchen view
  if (kitchen) {
    const columns = [
      { status: 'PENDING',   label: 'New Orders',     border: 'border-amber-500/40',   bg: 'bg-amber-500/5',   badge: 'bg-amber-500 text-white',   next: 'ACCEPTED'  },
      { status: 'ACCEPTED',  label: 'Accepted',        border: 'border-blue-500/40',    bg: 'bg-blue-500/5',    badge: 'bg-blue-500 text-white',    next: 'PREPARING' },
      { status: 'PREPARING', label: 'Preparing',       border: 'border-blue-500/40',    bg: 'bg-blue-500/5',    badge: 'bg-blue-600 text-white',    next: 'READY'     },
      { status: 'READY',     label: 'Ready to Serve',  border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500 text-white', next: 'SERVED'    },
    ]

    return (
      <div className="-m-6 min-h-[calc(100vh-56px)] bg-[#070C14] p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 shadow-lg">
              <ChefHat size={19} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-white">Kitchen Display</h1>
              <p className="text-[11px] font-medium text-slate-600">Real-time Orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[12px] font-semibold text-emerald-400">Live</span>
            </div>
            <button
              onClick={toggleSound}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-slate-700 hover:text-slate-300 ${sound ? 'bg-slate-800 text-slate-300' : 'bg-slate-900 text-slate-600'}`}
              aria-label={sound ? 'Turn notification sound off' : 'Turn notification sound on'}
            >
              {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 max-2xl:grid-cols-2 max-md:grid-cols-1">
          {columns.map(({ status, label, border, bg, badge, next }) => {
            const colOrders = (data.data || []).filter((o) => o.status === status)
            return (
              <section key={status} className={`min-h-[400px] rounded-2xl border p-3 ${border} ${bg}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-slate-300">{label}</h3>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${badge}`}>{colOrders.length}</span>
                </div>
                <div className="grid gap-3">
                  {colOrders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-slate-700/50 bg-slate-800/70 p-3.5 backdrop-blur-sm">
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-white">Table {order.table?.number || order.table?.name || '-'}</span>
                          {status === 'PENDING' && <span className="rounded-full border border-red-500/40 bg-red-500/20 px-1.5 py-0.5 text-[9px] font-black text-red-400 animate-pulse">NEW</span>}
                          {status === 'READY' && <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-400">READY!</span>}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">#{order.id?.slice(0, 6)}</span>
                      </div>
                      <div className="mb-3 grid gap-1.5">
                        {order.items?.map((item) => (
                          <div key={item.id || item.foodId} className="flex items-center gap-2">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-black text-slate-300">{item.quantity}</span>
                            <span className="text-[12px] text-slate-300">{item.food?.name || 'Item'}</span>
                          </div>
                        ))}
                      </div>
                      {order.note && (
                        <div className="mb-2.5 rounded-lg border border-amber-400/20 bg-amber-400/[0.08] px-2 py-1.5 text-[10px] leading-relaxed text-amber-400/80">⚠ {order.note}</div>
                      )}
                      <button
                        onClick={() => update(order, next)}
                        className="rounded-lg border border-slate-500/30 bg-slate-600/40 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition-all hover:bg-slate-600/60 active:scale-95"
                      >
                        {next} →
                      </button>
                    </article>
                  ))}
                  {!colOrders.length && <div className="py-10 text-center text-[12px] text-slate-700">No orders here</div>}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    )
  }

  if (user?.role === ROLES.WAITER) {
    const readyOrders = (data.data || []).filter((o) => o.status === 'READY')
    const serviceNotifications = (notifications.data || []).filter((item) => serviceRequestTypes.has(item.type))
    const unreadServiceRequests = serviceNotifications.filter((item) => !item.isRead).length

    return (
      <>
        <PageHead
          title="Ready to Serve"
          subtitle="Prepared orders waiting for the dining floor"
          actions={
            <Button variant="ghost" size="sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" /> Live
            </Button>
          }
        />
        {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>}

        <section className="mb-5 rounded-lg border border-amber-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Bell size={15} />
              </div>
              <div>
                <h3 className="m-0 text-[13px] font-black text-slate-900">Service Notifications</h3>
                <p className="m-0 text-[11px] font-semibold text-slate-400">Customer calls and table requests</p>
              </div>
            </div>
            {unreadServiceRequests > 0 && <Badge tone="amber">{unreadServiceRequests} new</Badge>}
          </div>

          {serviceNotifications.length ? (
            <div className="grid gap-2">
              {serviceNotifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${item.isRead ? 'border-slate-100 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${item.isRead ? 'bg-slate-300' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.isRead ? 'slate' : 'amber'}>{serviceRequestLabels[item.type] || item.type}</Badge>
                      <span className="text-[11px] font-semibold text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="m-0 mt-1 text-[12px] font-semibold text-slate-700">{item.message}</p>
                  </div>
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(item)}
                      className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-amber-200 bg-white text-amber-700 transition-colors hover:bg-amber-100"
                      aria-label="Mark notification as read"
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-[12px] font-semibold text-slate-400">
              No service requests
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {readyOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-emerald-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 min-w-14 place-items-center rounded-2xl bg-emerald-500 px-3 text-xl font-black text-white">
                    {order.table?.number || order.table?.name || '-'}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900">Table {order.table?.number || order.table?.name || '-'}</h3>
                    <p className="font-mono text-[11px] text-slate-400">#{order.id?.slice(0, 8)}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => update(order, 'SERVED')}>
                  <CheckCircle2 size={13} /> Served
                </Button>
              </div>
              <div className="grid gap-2">
                {order.items?.map((item) => (
                  <div key={item.id || item.foodId} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-[12px] font-black text-white">{item.quantity}</span>
                    <span className="text-[13px] font-semibold text-slate-700">{item.food?.name || 'Item'}</span>
                  </div>
                ))}
              </div>
              {order.note && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700">{order.note}</div>}
            </article>
          ))}
          {!readyOrders.length && <Empty title="No ready orders" />}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHead
        title="Order Management"
        subtitle="Live orders, table flow and status ownership"
        actions={
          <>
            <Button variant="ghost" size="sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" /> Live
            </Button>
            <Button size="sm"><Plus size={11} /> New Order</Button>
          </>
        }
      />
      {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', ...orderStatuses].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold transition-all ${filter === s ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            {s !== 'all' && <div className={`h-1.5 w-1.5 rounded-full ${statusTone[s] === 'success' ? 'bg-emerald-400' : statusTone[s] === 'warning' ? 'bg-amber-400' : statusTone[s] === 'danger' ? 'bg-red-400' : 'bg-blue-400'}`} />}
            {s === 'all' ? 'All Orders' : s}
            <span className={`grid min-w-[18px] place-items-center rounded-full px-1 py-0.5 text-[10px] font-black ${filter === s ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
              {s === 'all' ? data.data?.length || 0 : (data.data || []).filter((o) => o.status === s).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {visible.map((order) => (
          <div key={order.id} className="grid gap-2">
            <OrderRow order={order} onUpdate={(status) => update(order, status)} />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => showDetail(order)}>Details</Button>
            </div>
          </div>
        ))}
        {!visible.length && <Empty title="No orders" />}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.id?.slice(0, 8) || ''}`} width="max-w-2xl">
        {selected && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm max-sm:grid-cols-1">
              <div className="rounded-xl bg-slate-50 p-3"><b>Status</b><div>{selected.status}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><b>Total</b><div>{money(selected.totalAmount)}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><b>Table</b><div>{selected.table?.number || selected.table?.name || selected.tableId || '-'}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><b>Session</b><div className="break-all">{selected.guestSessionId}</div></div>
            </div>
            <div className="grid gap-2">
              {selected.items?.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex justify-between gap-3 text-sm font-semibold">
                    <span>{item.food?.name || item.foodId}</span>
                    <span>{item.quantity} x {money(item.price)}</span>
                  </div>
                  {!!item.selectedOptions?.length && (
                    <div className="mt-1 text-xs text-slate-500">
                      {item.selectedOptions.map((opt) => opt.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
