export function Row({ avatar, main, sub, right }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 max-sm:grid-cols-1">
      {avatar && <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 font-black text-slate-950">{String(avatar).slice(0, 2).toUpperCase()}</div>}
      <span className="min-w-0">
        <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-slate-950">{main}</b>
        {sub && <small className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-slate-500">{sub}</small>}
      </span>
      {right && <em className="not-italic font-extrabold text-slate-950">{right}</em>}
    </div>
  )
}
