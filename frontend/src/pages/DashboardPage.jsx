import {
  ShoppingCart, DollarSign, Grid3X3, Users, Utensils, QrCode,
  ArrowUpRight, RefreshCw, Plus,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { PageHead } from '../components/molecules/PageHead'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { StatCard } from '../components/molecules/StatCard'
import { Empty } from '../components/molecules/Empty'
import { api } from '../lib/api'
import { money, today } from '../lib/format'
import { useAsync } from '../hooks/useAsync'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
      <div className="mb-1.5 text-xs font-bold text-slate-800">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[11px]">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-900">{money(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const statusTone = { PENDING: 'warning', ACCEPTED: 'info', PREPARING: 'info', READY: 'success', SERVED: 'green', COMPLETED: 'slate', CANCELLED: 'danger' }

export function DashboardPage({ restaurantId, restaurant, nonce }) {
  const metrics = useAsync(() => restaurantId ? api(`/analytics/metrics?restaurantId=${restaurantId}`) : Promise.resolve({}), [restaurantId, nonce])
  const orders = useAsync(() => restaurantId ? api(`/orders?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId, nonce])
  const tables = useAsync(() => api('/tables').catch(() => []), [nonce])
  const foods = useAsync(() => restaurantId ? api(`/foods/public?restaurantId=${restaurantId}`) : Promise.resolve([]), [restaurantId, nonce])
  const popular = metrics.data?.popularFoods || []
  const recent = (orders.data || []).slice(0, 5)
  const maxPop = popular[0]?.quantity || popular[0]?._sum?.quantity || 1
  const loading = (metrics.loading && !metrics.data) || (orders.loading && !orders.data)
  const error = metrics.error || orders.error

  return (
    <>
      <PageHead
        title="Dashboard"
        subtitle={`${today} — ${restaurant?.name || 'Restaurant'}`}
        actions={
          <>
            <Button variant="outline" size="sm"><RefreshCw size={11} /> Refresh</Button>
            <Button size="sm"><Plus size={11} /> New Order</Button>
          </>
        }
      />

      {loading && <LoadingState title="Loading dashboard..." />}
      {error && !loading && <ErrorState error={error} />}
      {!loading && !error && (
        <>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard label="Today's Orders" value={metrics.data?.totalOrders || 0} Icon={ShoppingCart} color="amber" hint={`${metrics.data?.completedOrders || 0} completed`} />
        <StatCard label="Revenue" value={money(metrics.data?.revenue || 0)} Icon={DollarSign} color="emerald" />
        <StatCard label="Active Tables" value={`${tables.data?.filter((t) => t.status === 'OCCUPIED').length || 0} / ${tables.data?.length || 0}`} Icon={Grid3X3} color="blue" />
        <StatCard label="Staff Roles" value="RBAC" Icon={Users} color="purple" hint="Owner, waiter, kitchen" />
        <StatCard label="Menu Items" value={foods.data?.length || 0} Icon={Utensils} color="pink" />
        <StatCard label="QR Scans" value={metrics.data?.qr?.totalScans || 0} Icon={QrCode} color="orange" />
      </div>

      {/* Charts row */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="m-0 text-[13px] font-bold text-slate-900">Revenue Analytics</h3>
              <p className="m-0 mt-0.5 text-[11px] text-slate-400">Backend aggregate data</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-900" /><span className="text-slate-500">Revenue</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-slate-500">QR scans</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={[{
              name: 'Current',
              orders: metrics.data?.totalOrders || 0,
              completed: metrics.data?.completedOrders || 0,
              cancelled: metrics.data?.cancelledOrders || 0,
              scans: metrics.data?.qr?.totalScans || 0,
            }]} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="orders" name="Orders" fill="#0F172A" radius={[5, 5, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[5, 5, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#FCA5A5" radius={[5, 5, 0, 0]} />
              <Bar dataKey="scans" name="QR scans" fill="#F59E0B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Popular foods */}
        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Most Popular Foods</h3>
          {popular.length ? (
            <div className="space-y-3.5">
              {popular.slice(0, 6).map((row, i) => {
                const qty = row.quantity || row._sum?.quantity || 0
                return (
                  <div key={row.foodId || i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate pr-2 text-[12px] font-medium text-slate-700">{row.food?.name || row.foodId}</span>
                      <span className="flex-shrink-0 text-[12px] font-bold text-slate-900">{qty}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${Math.round((qty / maxPop) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <Empty title="No analytics yet" />}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button className="flex items-center gap-1 text-[12px] font-semibold text-amber-600 transition-colors hover:text-amber-700">
              Full analytics <ArrowUpRight size={11} />
            </button>
          </div>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="m-0 text-[13px] font-bold text-slate-900">Recent Orders</h3>
            <p className="m-0 mt-0.5 text-[11px] text-slate-400">Kitchen and service flow</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Order ID', 'Table', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-slate-800">#{o.id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">Table {o.table?.number || o.table?.name || '-'}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 max-w-[200px] truncate">
                    {o.items?.map((i) => `${i.quantity}× ${i.food?.name || 'Item'}`).join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-900">{money(o.totalAmount)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone[o.status] || 'slate'}>{o.status}</Badge></td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">{new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recent.length && <Empty title="No orders yet" />}
        </div>
      </Card>
        </>
      )}
    </>
  )
}
