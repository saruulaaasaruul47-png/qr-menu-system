export function TextArea({ label, className = '', ...props }) {
  return (
    <label className={`grid gap-1.5 text-left ${className}`}>
      {label && <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>}
      <textarea
        className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/15"
        {...props}
      />
    </label>
  )
}
