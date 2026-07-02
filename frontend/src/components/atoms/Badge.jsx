const tones = {
  slate:   'bg-slate-100 text-slate-600',
  dark:    'bg-slate-900 text-white',
  blue:    'bg-blue-50 text-blue-700 border border-blue-200',
  green:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  red:     'bg-red-50 text-red-600 border border-red-200',
  amber:   'bg-amber-50 text-amber-700 border border-amber-200',
  purple:  'bg-purple-50 text-purple-700 border border-purple-200',
  orange:  'bg-orange-50 text-orange-700 border border-orange-200',
  pink:    'bg-pink-50 text-pink-700 border border-pink-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger:  'bg-red-50 text-red-600 border border-red-200',
  info:    'bg-blue-50 text-blue-700 border border-blue-200',
}

export function Badge({ children, tone = 'slate' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  )
}
