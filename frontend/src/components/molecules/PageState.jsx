import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../atoms/Button'
import { Empty } from './Empty'

export function LoadingState({ title = 'Loading data...', text = 'Please wait while the latest information is fetched.' }) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
      <div>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin text-amber-500" />
        <b className="text-sm font-bold text-slate-800">{title}</b>
        <p className="mt-1 text-sm font-medium text-slate-400">{text}</p>
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-lg border border-red-100 bg-red-50 p-6 text-center">
      <div>
        <AlertCircle size={30} className="mx-auto mb-3 text-red-500" />
        <b className="text-sm font-bold text-red-800">{title}</b>
        <p className="mx-auto mt-1 max-w-md text-sm font-medium text-red-600">{error || 'The request could not be completed.'}</p>
        {onRetry && <Button className="mt-4" size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
      </div>
    </div>
  )
}

export function EmptyState({ title = 'No data yet', text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white">
      <Empty title={title} text={text} />
    </div>
  )
}

export function AsyncState({ state, loadingTitle, emptyTitle, emptyText, children }) {
  if (state?.loading && !state?.data) return <LoadingState title={loadingTitle} />
  if (state?.error) return <ErrorState error={state.error} />

  const data = state?.data
  const isEmpty = Array.isArray(data) ? data.length === 0 : data === null || data === undefined
  if (isEmpty) return <EmptyState title={emptyTitle} text={emptyText} />

  return children
}
