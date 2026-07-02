import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from '../atoms/Card'

const colorMap = {
  amber:   'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue:    'bg-blue-50 text-blue-600',
  purple:  'bg-violet-50 text-violet-600',
  pink:    'bg-pink-50 text-pink-600',
  orange:  'bg-orange-50 text-orange-600',
}

export function StatCard({ label, value, Icon, icon: IconLegacy, color = 'amber', change, changeLabel, hint }) {
  const Ic = Icon || IconLegacy
  const pos = (change ?? 0) >= 0

  return (
    <Card className="transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color] || colorMap.amber}`}>
          {Ic && <Ic size={17} />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
            {pos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-slate-500">{label}</div>
      {(changeLabel || hint) && <div className="mt-1 text-[11px] text-slate-400">{changeLabel || hint}</div>}
    </Card>
  )
}
