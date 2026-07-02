export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
      <span className="select-none">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-400' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </label>
  )
}
