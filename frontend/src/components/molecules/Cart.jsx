import { Button } from '../atoms/Button'
import { money } from '../../lib/format'

export function Cart({ items, qty, order, message }) {
  const total = items.reduce((sum, item) => sum + Number(item.discountPrice || item.price || 0) * item.quantity, 0)

  return (
    <aside className="sticky top-24 grid self-start gap-3.5 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] max-lg:static">
      <h2 className="m-0 text-xl font-black">Your Order</h2>
      <div className="grid gap-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 rounded-lg border border-slate-200 p-2.5">
            <span className="min-w-0 font-extrabold">
              {item.name}
              <small className="mt-0.5 block text-slate-500">{money(item.price)}</small>
            </span>
            <div className="flex items-center gap-2">
              <button className="h-7 w-7 rounded-lg bg-slate-950 font-black text-white" onClick={() => qty(item.id, -1)}>-</button>
              <b>{item.quantity}</b>
              <button className="h-7 w-7 rounded-lg bg-slate-950 font-black text-white" onClick={() => qty(item.id, 1)}>+</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="m-0 text-sm text-slate-500">Your order is empty</p>}
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-3.5 text-lg">
        <span>Total</span>
        <b>{money(total)}</b>
      </div>
      <Button variant="dark" className="w-full" disabled={!items.length} onClick={order}>Place Order</Button>
      {message && <p className="m-0 rounded-xl bg-emerald-100 p-3 text-sm font-bold text-emerald-700">{message}</p>}
    </aside>
  )
}
