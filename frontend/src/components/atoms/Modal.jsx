import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${width} rounded-lg bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
