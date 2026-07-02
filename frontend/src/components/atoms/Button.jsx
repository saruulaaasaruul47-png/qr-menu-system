const variants = {
  primary: 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-sm border-transparent',
  dark:    'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border-transparent',
  ghost:   'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
  outline: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  danger:  'bg-red-500 hover:bg-red-600 text-white border-transparent',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
