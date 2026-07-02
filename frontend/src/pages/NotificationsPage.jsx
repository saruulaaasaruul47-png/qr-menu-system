import { useState } from 'react'
import { Bell, Mail, CheckCheck } from 'lucide-react'
import { Button } from '../components/atoms/Button'
import { Badge } from '../components/atoms/Badge'
import { Card } from '../components/atoms/Card'
import { Field } from '../components/atoms/Field'
import { SelectField } from '../components/atoms/SelectField'
import { Toggle } from '../components/atoms/Toggle'
import { PageHead } from '../components/molecules/PageHead'
import { Empty } from '../components/molecules/Empty'
import { ErrorState, LoadingState } from '../components/molecules/PageState'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'

const typeTone = { INFO: 'info', WARNING: 'warning', ERROR: 'danger', SUCCESS: 'success' }

export function NotificationsPage({ restaurantId, refresh, nonce }) {
  const notifications = useAsync(() => api('/notifications'), [nonce])
  const [note, setNote] = useState({ type: 'INFO', message: '' })
  const [email, setEmail] = useState({ to: '', subject: '', template: 'ORDER_CONFIRMATION' })

  const create = async (e) => {
    e.preventDefault()
    await api('/notifications', { method: 'POST', body: JSON.stringify({ restaurantId, type: note.type, message: note.message }) })
    setNote({ type: 'INFO', message: '' })
    refresh()
  }
  const markRead = async (item) => {
    await api(`/notifications/${item.id}/read`, { method: 'PATCH' })
    refresh()
  }
  const sendEmail = async (e) => {
    e.preventDefault()
    await api('/emails', { method: 'POST', body: JSON.stringify({ restaurantId, to: email.to, subject: email.subject, template: email.template, data: {} }) })
    setEmail({ to: '', subject: '', template: 'ORDER_CONFIRMATION' })
  }

  const notifList = notifications.data || []
  const unread = notifList.filter((n) => !n.isRead).length

  return (
    <>
      <PageHead title="Notifications" subtitle="WebSocket, email, waiter calls and owner preferences" />
      {notifications.loading && !notifications.data && <LoadingState title="Loading notifications..." />}
      {notifications.error && <ErrorState error={notifications.error} />}
      {!notifications.loading && !notifications.error && (
      <>

      <div className="mb-5 grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Create Notification</h3>
          <form onSubmit={create} className="grid gap-3">
            <SelectField label="Type" value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value })}>
              {['INFO', 'WARNING', 'ERROR', 'SUCCESS'].map((t) => <option key={t}>{t}</option>)}
            </SelectField>
            <Field label="Message" value={note.message} onChange={(e) => setNote({ ...note, message: e.target.value })} placeholder="Notification content…" />
            <Button><Bell size={12} /> Create</Button>
          </form>
        </Card>

        <Card>
          <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Send Email</h3>
          <form onSubmit={sendEmail} className="grid gap-3">
            <Field label="To" type="email" icon={Mail} value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} placeholder="recipient@email.com" />
            <Field label="Subject" value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
            <SelectField label="Template" value={email.template} onChange={(e) => setEmail({ ...email, template: e.target.value })}>
              {['ORDER_CONFIRMATION', 'ORDER_READY', 'PAYMENT_SUCCESS', 'RECEIPT', 'REFUND_CONFIRMATION', 'EMPLOYEE_INVITATION', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'SUBSCRIPTION_REMINDER', 'SECURITY_ALERT'].map((t) => <option key={t}>{t}</option>)}
            </SelectField>
            <Button><Mail size={12} /> Send email</Button>
          </form>
        </Card>
      </div>

      <Card className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-[13px] font-bold text-slate-900">Inbox</h3>
          {unread > 0 && <Badge tone="amber">{unread} unread</Badge>}
        </div>
        {notifList.length ? (
          <div className="grid gap-2">
            {notifList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${item.isRead ? 'border-slate-100 bg-white' : 'border-amber-200 bg-amber-50'}`}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${item.isRead ? 'bg-slate-100' : 'bg-amber-100'}`}>
                  <Bell size={13} className={item.isRead ? 'text-slate-400' : 'text-amber-600'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={typeTone[item.type] || 'slate'}>{item.type}</Badge>
                    <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-700">{item.message}</p>
                </div>
                {!item.isRead && (
                  <button onClick={() => markRead(item)} className="flex-shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-white">
                    <CheckCheck size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : <Empty title="No notifications" />}
      </Card>

      <Card>
        <h3 className="m-0 mb-4 text-[13px] font-bold text-slate-900">Email Preferences</h3>
        <div className="grid gap-2">
          {['Receipt Email', 'Daily Report', 'Weekly Report', 'Monthly Report', 'Subscription Reminder', 'Security Alert'].map((item) => (
            <div key={item} className="flex min-h-11 items-center justify-between rounded-xl border border-slate-100 px-3">
              <span className="text-[13px] font-semibold text-slate-700">{item}</span>
              <Toggle label="" checked={true} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Card>
      </>
      )}
    </>
  )
}
