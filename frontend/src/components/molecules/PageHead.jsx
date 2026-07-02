export function PageHead({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm font-medium text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}
