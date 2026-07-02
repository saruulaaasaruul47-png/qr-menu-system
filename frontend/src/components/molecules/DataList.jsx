import { Card } from '../atoms/Card'
import { EmptyState, ErrorState, LoadingState } from './PageState'

export function DataList({ items, render, empty, loading, error }) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return (
    <Card className="grid gap-2.5">
      {items?.length ? items.map((item, index) => <div key={item.id || index}>{render(item, index)}</div>) : <EmptyState title={empty || 'No data'} />}
    </Card>
  )
}
