import { useEffect, useState } from 'react'
import { AppShell } from './components/organisms/AppShell'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { RestaurantsPage } from './pages/RestaurantsPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { TablesQrPage } from './pages/TablesQrPage'
import { MenuPage } from './pages/MenuPage'
import { OrdersPage } from './pages/OrdersPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { LoyaltyPage } from './pages/LoyaltyPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { AuditPage } from './pages/AuditPage'
import { SettingsPage } from './pages/SettingsPage'
import { CustomerMenuPage } from './pages/CustomerMenuPage'
import { StatusPage } from './pages/StatusPage'
import { api, getToken } from './lib/api'
import { route } from './lib/router'
import { useAsync } from './hooks/useAsync'
import { EmptyState, LoadingState } from './components/molecules/PageState'
import { useNotificationSounds } from './hooks/useNotificationSounds'
import { useRealtime } from './hooks/useRealtime'
import { nav, roleHome } from './constants/navigation'
import { canSeeNavItem, hasPermission, PERMISSIONS, ROLES } from './lib/permissions'

function QrScanPage({ path }) {
  const qrId = path.split('/')[2]

  useEffect(() => {
    let active = true
    const openScannedMenu = async () => {
      const guestSessionId = localStorage.getItem('guestSessionId') || crypto.randomUUID()
      localStorage.setItem('guestSessionId', guestSessionId)

      try {
        const scan = await api(`/qr/${qrId}/scan?guestSessionId=${encodeURIComponent(guestSessionId)}`)
        if (!active) return
        if (scan?.menuUrl) window.location.href = scan.menuUrl
        else route('/login')
      } catch {
        if (active) route('/login')
      }
    }

    openScannedMenu()
    return () => { active = false }
  }, [qrId])

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FAFC] p-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-400" />
        <p className="text-sm font-semibold text-slate-600">Opening menu...</p>
      </div>
    </main>
  )
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  return path
}

function AppWorkspace() {
  const [active, setActive] = useState('')
  const [nonce, setNonce] = useState(0)
  const me = useAsync(() => api('/auth/me'), [nonce])
  const restaurantId = me.data?.restaurantId || localStorage.getItem('restaurantId')
  const canManageRestaurant = hasPermission(me.data, PERMISSIONS.MANAGE_RESTAURANT)
  // Employees can't call GET /restaurants (needs manage_restaurant), so fall
  // back to the public profile endpoint for their own restaurant's info.
  const restaurants = useAsync(async () => {
    if (!me.data) return []
    if (canManageRestaurant) {
      try {
        return await api('/restaurants')
      } catch {
        return []
      }
    }
    if (!restaurantId) return []
    try {
      const restaurant = await api(`/restaurants/public/${restaurantId}`)
      return [restaurant]
    } catch {
      return []
    }
  }, [nonce, me.data, canManageRestaurant, restaurantId])
  const restaurant = restaurants.data?.find((r) => r.id === restaurantId) || restaurants.data?.[0] || null
  const refresh = () => setNonce((v) => v + 1)
  const playNotificationSound = useNotificationSounds(me.data?.role)

  useRealtime({
    restaurantId,
    role: me.data?.role,
    onEvent: (event) => {
      refresh()
      playNotificationSound(event)
    },
  })

  useEffect(() => {
    if (!getToken()) route('/login')
  }, [])

  useEffect(() => {
    if (me.error) route('/login')
  }, [me.error])

  useEffect(() => {
    if (!me.data) return
    const allowedIds = nav.filter((item) => canSeeNavItem(me.data, item)).map((item) => item.id)
    const preferred = roleHome[me.data.role] || allowedIds[0]
    const nextActive = !active && allowedIds.includes(preferred)
      ? preferred
      : allowedIds.length && !allowedIds.includes(active)
        ? allowedIds[0]
        : ''
    if (nextActive) queueMicrotask(() => setActive(nextActive))
  }, [me.data, active])

  const props = { restaurantId, restaurant, refresh, user: me.data, nonce }

  if (me.loading && !me.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAFC]">
        <div className="w-full max-w-md px-4"><LoadingState title="Loading workspace..." /></div>
      </main>
    )
  }

  const roleLabel = {
    [ROLES.SUPER_ADMIN]: 'Super Admin Console',
    [ROLES.OWNER]: 'Owner Dashboard',
    [ROLES.MANAGER]: 'Manager Dashboard',
    [ROLES.WAITER]: 'Waiter Screen',
    [ROLES.KITCHEN]: 'Kitchen Screen',
    [ROLES.CASHIER]: 'Cashier Screen',
  }[me.data?.role] || 'Workspace'

  const view = {
    dashboard:     <DashboardPage {...props} />,
    restaurants:   <RestaurantsPage {...props} />,
    employees:     <EmployeesPage {...props} />,
    tables:        <TablesQrPage {...props} />,
    menu:          <MenuPage {...props} />,
    orders:        <OrdersPage {...props} />,
    kitchen:       <OrdersPage {...props} kitchen />,
    payments:      <PaymentsPage {...props} />,
    analytics:     <AnalyticsPage {...props} />,
    loyalty:       <LoyaltyPage {...props} />,
    notifications: <NotificationsPage {...props} />,
    audit:         <AuditPage {...props} />,
    settings:      <SettingsPage {...props} />,
  }[active] || null

  return (
    <AppShell active={active} setActive={setActive} user={me.data} restaurant={restaurant} refresh={refresh} roleLabel={roleLabel}>
      {view || (
        <EmptyState title={roleLabel} text="No screen is available for this account. Check role permissions in backend." />
      )}
    </AppShell>
  )
}

export default function App() {
  const path = usePath()
  if (path.startsWith('/qr/')) return <QrScanPage path={path} />
  if (path.startsWith('/menu/')) return <CustomerMenuPage path={path} />
  if (path.startsWith('/order/status/')) return <StatusPage path={path} />
  if (path === '/' || path === '/login') return <AuthPage mode="login" />
  if (path === '/register') return <AuthPage mode="register" />
  if (path === '/forgot-password') return <AuthPage mode="forgot" />
  if (path === '/reset-password') return <AuthPage mode="reset" />
  if (path === '/app' && getToken()) return <AppWorkspace />
  if (!getToken()) return <AuthPage mode="login" />
  return <AppWorkspace />
}
