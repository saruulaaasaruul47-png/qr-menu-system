import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { orderStatuses } from '../../constants/navigation'
import { money } from '../../lib/format'

const statusTone = {
  PENDING:   'warning',
  ACCEPTED:  'info',
  PREPARING: 'info',
  READY:     'success',
  SERVED:    'green',
  COMPLETED: 'slate',
  CANCELLED: 'danger',
}

export function OrderRow({ order, onUpdate, kitchen }) {
  const next = orderStatuses[orderStatuses.indexOf(order.status) + 1]

  if (kitchen) {
    return (
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid h-11 min-w-11 place-items-center rounded-xl bg-amber-400 px-2 font-black text-slate-900">
          {order.table?.number || order.table?.name || '-'}
        </div>
        <span className="min-w-0">
          <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-slate-900 text-[13px]">#{order.id?.slice(0, 8)}</b>
          <small className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-slate-400 text-[11px]">
            {order.items?.map((i) => `${i.quantity}× ${i.food?.name || 'Item'}`).join(' · ') || 'No items'}
          </small>
        </span>
        <div className="flex flex-col gap-1.5 items-end">
          <Badge tone={statusTone[order.status] || 'slate'}>{order.status}</Badge>
          {next && onUpdate && <Button size="sm" variant="ghost" onClick={() => onUpdate(next)}>{next}</Button>}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md max-lg:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="grid h-11 min-w-11 place-items-center rounded-xl bg-slate-900 px-2 font-black text-white text-[15px]">
        {order.table?.number || order.table?.name || '-'}
      </div>
      <span className="min-w-0">
        <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-slate-900 font-mono text-[13px]">#{order.id?.slice(0, 8)}</b>
        <small className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-slate-400 text-[11px]">
          {order.items?.map((i) => `${i.quantity}× ${i.food?.name || 'Item'}`).join(' · ') || 'No items'}
        </small>
      </span>
      <Badge tone={statusTone[order.status] || 'slate'}>{order.status}</Badge>
      <strong className="text-[13px] font-black text-slate-900 max-lg:hidden">{money(order.totalAmount)}</strong>
      {next && onUpdate && <Button size="sm" variant="ghost" onClick={() => onUpdate(next)}>{next}</Button>}
    </div>
  )
}
