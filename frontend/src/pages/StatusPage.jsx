import { Receipt, Clock } from 'lucide-react'
import { Card } from '../components/atoms/Card'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { OrderRow } from '../components/molecules/OrderRow'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useRealtime } from '../hooks/useRealtime'
import { useState } from 'react'

export function StatusPage({ path }) {
  const session = path.split('/').pop()
  const [nonce, setNonce] = useState(0)
  const data = useAsync(() => api(`/orders/guest/status/${session}`).catch(() => null), [session, nonce])
  useRealtime({ sessionToken: session, onEvent: () => setNonce((v) => v + 1) })
  const orders = Array.isArray(data.data) ? data.data : data.data ? [data.data] : []

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FAFC] p-6">
      <Card className="w-full max-w-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-amber-400 shadow-lg">
            <Receipt size={26} className="text-slate-900" />
          </div>
          <h1 className="m-0 text-[26px] font-black text-slate-900">Order Status</h1>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
            <Clock size={12} />
            <span className="font-mono">{session}</span>
          </div>
        </div>
        <div className="grid gap-3">
          {data.loading && !data.data && <LoadingState title="Loading order status..." />}
          {data.error && <ErrorState error={data.error} />}
          {orders.map((order) => <OrderRow key={order.id} order={order} />)}
        </div>
        {!data.loading && !data.error && !orders.length && (
          <Empty
            title="Waiting for order data"
            text="Your order will appear here after checkout."
          />
        )}
      </Card>
    </main>
  )
}
