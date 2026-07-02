import { Utensils, Plus } from 'lucide-react'
import { Button } from '../atoms/Button'
import { Card } from '../atoms/Card'
import { money } from '../../lib/format'

export function FoodCard({ food, onAdd }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[1.4] overflow-hidden bg-slate-100">
        {food.imageUrl
          ? <img className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]" src={food.imageUrl} alt={food.name} />
          : <div className="grid h-full place-items-center text-4xl text-slate-300"><Utensils size={48} /></div>
        }
        <div className="absolute left-3 top-3 flex gap-1">
          {food.isSpicy && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">🌶 Spicy</span>}
          {food.isVegetarian && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">🌿 Veg</span>}
        </div>
        {!food.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">Unavailable</span>
          </div>
        )}
      </div>
      <div className="grid gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 text-[13px] font-bold leading-tight text-slate-900">{food.displayName || food.name}</h3>
          <span className="flex-shrink-0 text-[15px] font-black text-slate-900">{money(food.discountPrice || food.price)}</span>
        </div>
        <p className="m-0 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{food.displayDescription || food.description || 'Fresh from the kitchen.'}</p>
        {onAdd && (
          <Button variant="dark" size="sm" onClick={() => onAdd(food)} className="w-full justify-center">
            <Plus size={13} /> Add to Order
          </Button>
        )}
      </div>
    </Card>
  )
}
