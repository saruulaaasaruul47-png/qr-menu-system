import { useState } from 'react'
import { QrCode, Search, Bell, RefreshCw, LogOut, Menu, X } from 'lucide-react'
import { nav, groupLabels } from '../../constants/navigation'
import { api, clearSession } from '../../lib/api'
import { route } from '../../lib/router'
import { canSeeNavItem, hasPermission, PERMISSIONS } from '../../lib/permissions'

export function AppShell({ active, setActive, children, user, restaurant, refresh, roleLabel }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const visibleNav = nav.filter((item) => !item.hidden && canSeeNavItem(user, item))
  const canOpenCustomerView = restaurant?.id && hasPermission(user, PERMISSIONS.MANAGE_TABLES)
  const canOpenNotifications = canSeeNavItem(user, nav.find((item) => item.id === 'notifications'))

  const logout = () => {
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
    route('/login')
  }

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#F8FAFC]">
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[232px] flex-shrink-0 select-none flex-col bg-[#0F172A] transition-transform duration-200 lg:static lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400 shadow-lg">
            <QrCode size={17} className="text-slate-900" />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-tight text-white">MenuQR</div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-600">{roleLabel || 'RESTAURANT OS'}</div>
          </div>
          <button
            type="button"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.06] lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:none]">
          {Object.keys(groupLabels).map((group) => {
            const items = visibleNav.filter((item) => item.group === group)
            if (!items.length) return null
            return (
              <section key={group} className="grid gap-0.5">
                {groupLabels[group] && (
                  <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    {groupLabels[group]}
                  </p>
                )}
                {items.map(({ id, label, Icon }) => {
                  const isActive = active === id
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActive(id)
                        setMenuOpen(false)
                      }}
                      className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-amber-400/[0.14] text-amber-400'
                          : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
                      }`}
                    >
                      <Icon
                        size={15}
                        className={isActive ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}
                      />
                      <span className="flex-1">{label}</span>
                      {isActive && <b className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                    </button>
                  )
                })}
              </section>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.05]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-slate-900">
              {(user?.name || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-white">{user?.name || 'Admin User'}</div>
              <div className="truncate text-[10px] text-slate-600">{user?.email || 'admin@menuqr.io'}</div>
            </div>
            <button
              onClick={logout}
              className="p-1 text-slate-600 transition-colors hover:text-red-400"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* TopBar */}
        <header className="flex min-h-14 flex-shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-3 py-2 sm:px-6">
          <button
            type="button"
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={17} />
          </button>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/15"
              placeholder="Search restaurants, orders, foods..."
            />
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {canOpenCustomerView && (
              <button
                onClick={() => route(`/menu/${restaurant.id}/table/demo`)}
                className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 sm:flex"
              >
                <QrCode size={12} /> Customer View
              </button>
            )}
            <button
              onClick={refresh}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            >
              <RefreshCw size={15} />
            </button>
            {canOpenNotifications && (
              <button
                type="button"
                onClick={() => setActive('notifications')}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  active === 'notifications'
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                aria-label="Open notifications"
                title="Notifications"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-amber-400" />
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
              <span className="text-[11px] font-bold text-white">{(user?.name || 'AD').slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 [scrollbar-width:none]">{children}</section>
      </section>
    </main>
  )
}
