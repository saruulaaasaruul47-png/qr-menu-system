import { FolderOpen } from 'lucide-react'

export function Empty({ title, text }) {
  return (
    <div className="grid place-items-center gap-2 px-3 py-10 text-center">
      <FolderOpen size={36} className="text-slate-200" />
      <b className="text-sm font-semibold text-slate-600">{title}</b>
      {text && <p className="m-0 text-sm text-slate-400">{text}</p>}
    </div>
  )
}
