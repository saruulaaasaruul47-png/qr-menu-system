export function SelectField({ label, className = '', children, ...props }) {
  return (
    <label className={`grid gap-1.5 text-left ${className}`}>
      {label && <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>}
      <select
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/15"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
