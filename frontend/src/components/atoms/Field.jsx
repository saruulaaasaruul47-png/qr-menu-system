export function Field({ label, icon: Icon, className = '', inputClassName = '', ...props }) {
  return (
    <label className={`grid gap-1.5 text-left ${className}`}>
      {label && <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>}
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-400 transition-all focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-400/15">
        {Icon && <Icon size={13} className="flex-shrink-0" />}
        <input
          className={`min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none ${inputClassName}`}
          {...props}
        />
      </div>
    </label>
  )
}
