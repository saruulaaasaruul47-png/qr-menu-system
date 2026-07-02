import { useState } from 'react'
import { RefreshCw, ShieldCheck, Activity } from 'lucide-react'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { SelectField } from '../components/atoms/SelectField'
import { Button } from '../components/atoms/Button'
import { PageHead } from '../components/molecules/PageHead'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { ROLES } from '../lib/permissions'

const entityColors = {
  Order: 'amber', Restaurant: 'blue', Employee: 'purple', Food: 'green',
  Payment: 'emerald', Table: 'orange', Category: 'pink',
}

export function AuditPage({ refresh, nonce, user }) {
  const [outboxStatus, setOutboxStatus] = useState('')
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const data = useAsync(() => api('/audit-logs'), [nonce])
  const outbox = useAsync(
    () => isSuperAdmin ? Promise.resolve([]) : api(`/event-outbox?limit=50${outboxStatus ? `&status=${outboxStatus}` : ''}`),
    [nonce, outboxStatus, isSuperAdmin],
  )

  const logs = data.data || []
  const events = outbox.data || []

  return (
    <>
      <PageHead
        title="Audit Log"
        subtitle={isSuperAdmin ? 'Restaurant registration and removal history' : 'Who changed what, when and from where'}
      />
      {((data.loading && !data.data) || (outbox.loading && !outbox.data)) && <LoadingState title="Loading audit log..." />}
      {(data.error || outbox.error) && <ErrorState error={data.error || outbox.error} />}
      {!data.loading && !outbox.loading && !data.error && !outbox.error && (
      <>

      <Card className="mb-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={15} className="text-slate-500" />
          <h3 className="m-0 text-[13px] font-bold text-slate-900">Activity Log</h3>
          <span className="ml-auto text-[12px] text-slate-400">{logs.length} entries</span>
        </div>
        {logs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Action', 'Entity', 'User', 'Time'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-[12px] font-semibold text-slate-900">{log.action}</td>
                    <td className="px-4 py-3"><Badge tone={entityColors[log.entity] || 'slate'}>{log.entity || 'System'}</Badge></td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{log.userId ? `User ${log.userId.slice(0, 8)}` : 'System'}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No audit logs yet" />}
      </Card>

      {!isSuperAdmin && <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-slate-500" />
            <h3 className="m-0 text-[13px] font-bold text-slate-900">Event Outbox</h3>
          </div>
          <div className="flex items-center gap-2">
            <SelectField label="" value={outboxStatus} onChange={(e) => setOutboxStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="FAILED">FAILED</option>
            </SelectField>
          </div>
        </div>
        {events.length ? (
          <div className="grid gap-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">{event.type}</span>
                    <Badge tone={event.status === 'PUBLISHED' ? 'success' : event.status === 'FAILED' ? 'danger' : 'warning'}>{event.status}</Badge>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{new Date(event.createdAt).toLocaleString()} · {event.attempts || 0} attempts</div>
                </div>
                {event.status === 'FAILED' && (
                  <Button variant="outline" size="sm" onClick={async () => { await api(`/event-outbox/${event.id}/retry`, { method: 'POST' }); refresh() }}>
                    <RefreshCw size={10} /> Retry
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : <Empty title="No outbox events" />}
      </Card>}
      </>
      )}
    </>
  )
}
