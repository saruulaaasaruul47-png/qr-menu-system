export function Card({ children, className = '' }) {
  return <section className={`rounded-lg border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] ${className}`}>{children}</section>
}
