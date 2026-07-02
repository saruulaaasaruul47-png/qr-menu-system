import { DollarSign, ShoppingCart, TrendingUp, QrCode, Store } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '../components/atoms/Card'
import { PageHead } from '../components/molecules/PageHead'
import { StatCard } from '../components/molecules/StatCard'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { money } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { ROLES } from '../lib/permissions'

const PIE_COLORS = ['#F59E0B', '#0F172A', '#22C55E', '#6366F1', '#EC4899']

export function AnalyticsPage({ restaurantId, nonce, user }) {
  const data = useAsync(() => {
    if (user?.role === ROLES.SUPER_ADMIN) return api(restaurantId ? `/analytics/metrics?restaurantId=${restaurantId}` : '/analytics/metrics')
    return restaurantId ? api(`/analytics/metrics?restaurantId=${restaurantId}`) : Promise.resolve({})
  }, [restaurantId, nonce, user?.role])
  const popular = (data.data?.popularFoods || []).slice(0, 5).map((f, i) => ({
    name: f.food?.name || f.foodId || `Item ${i + 1}`,
    value: f.quantity || f._sum?.quantity || 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))
  const aggregate = [{
    name: 'Current',
    totalOrders: data.data?.totalOrders || 0,
    completedOrders: data.data?.completedOrders || 0,
    cancelledOrders: data.data?.cancelledOrders || 0,
    qrScans: data.data?.qr?.totalScans || 0,
  }]
  const events = data.data?.eventCounts || []
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  if (data.loading && !data.data) return <LoadingState title="Loading analytics..." />
  if (data.error) return <ErrorState error={data.error} />

  if (isSuperAdmin) {
    return (
      <>
        <PageHead title="Analytics" subtitle="Platform overview across registered restaurants" />

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Restaurants" value={data.data?.restaurantCount || 0} Icon={Store} color="amber" />
          <StatCard label="Revenue" value={money(data.data?.revenue || 0)} Icon={DollarSign} color="blue" />
          <StatCard label="Total Orders" value={data.data?.totalOrders || 0} Icon={ShoppingCart} color="emerald" />
          <StatCard label="Completed" value={data.data?.completedOrders || 0} Icon={TrendingUp} color="purple" />
        </div>

        <Card>
          <h3 className="m-0 mb-5 text-[13px] font-bold text-slate-900">Platform Revenue & Orders</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={aggregate} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }} />
              <Bar dataKey="totalOrders" name="Orders" fill="#0F172A" radius={[5, 5, 0, 0]} />
              <Bar dataKey="completedOrders" name="Completed" fill="#22C55E" radius={[5, 5, 0, 0]} />
              <Bar dataKey="cancelledOrders" name="Cancelled" fill="#FCA5A5" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title="Analytics"
        subtitle={user?.role === ROLES.SUPER_ADMIN ? 'Performance overview across all restaurants' : 'Performance overview for this restaurant'}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={data.data?.totalOrders || 0} Icon={ShoppingCart} color="amber" />
        <StatCard label="Completed" value={data.data?.completedOrders || 0} Icon={TrendingUp} color="emerald" />
        <StatCard label="Revenue" value={money(data.data?.revenue || 0)} Icon={DollarSign} color="blue" />
        <StatCard label="QR Scans" value={data.data?.qr?.totalScans || 0} Icon={QrCode} color="purple" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Aggregate metrics */}
        <Card className="lg:col-span-2">
          <h3 className="m-0 mb-5 text-[13px] font-bold text-slate-900">Operational Metrics</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={aggregate} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }} />
              <Bar dataKey="totalOrders" name="Orders" fill="#0F172A" radius={[5, 5, 0, 0]} />
              <Bar dataKey="completedOrders" name="Completed" fill="#22C55E" radius={[5, 5, 0, 0]} />
              <Bar dataKey="cancelledOrders" name="Cancelled" fill="#FCA5A5" radius={[5, 5, 0, 0]} />
              <Bar dataKey="qrScans" name="QR scans" fill="#F59E0B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Popular foods pie */}
        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Top Foods by Orders</h3>
          {popular.length ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={popular} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value">
                    {popular.map((_, i) => <Cell key={i} fill={popular[i].color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} orders`]} contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {popular.map((f) => (
                  <div key={f.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: f.color }} />
                    <span className="flex-1 truncate text-[11px] text-slate-500">{f.name}</span>
                    <span className="text-[12px] font-bold text-slate-900">{f.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty title="No popular food data" />}
        </Card>
      </div>

      {/* Analytics events */}
      <Card>
        <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Analytics Events</h3>
        {events.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={events} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }} />
              <Bar dataKey="count" name="Events" fill="#0F172A" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty title="No analytics events yet" />}
      </Card>
    </>
  )
}
