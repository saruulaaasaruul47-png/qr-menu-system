import {
  LayoutDashboard, Store, Users, QrCode, Utensils,
  ClipboardList, ChefHat, CreditCard, BarChart3,
  Star, Bell, ShieldCheck, Settings,
} from 'lucide-react'
import { PERMISSIONS, ROLES } from '../lib/permissions'

// `permission` mirrors the backend's requirePermissions() gate for the page's
// primary API call, so a role only sees a tab it can actually use.
export const nav = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, group: 'main', permission: PERMISSIONS.VIEW_REPORTS, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { id: 'restaurants', label: 'Restaurants', Icon: Store, group: 'manage', permission: PERMISSIONS.MANAGE_RESTAURANT, roles: [ROLES.SUPER_ADMIN] },
  { id: 'employees', label: 'Employees', Icon: Users, group: 'manage', permission: PERMISSIONS.MANAGE_EMPLOYEES, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { id: 'tables', label: 'Tables & QR', Icon: QrCode, group: 'manage', permission: PERMISSIONS.MANAGE_TABLES, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { id: 'menu', label: 'Menu', Icon: Utensils, group: 'manage', permission: PERMISSIONS.MANAGE_MENU, roles: [ROLES.OWNER, ROLES.MANAGER] },
  { id: 'orders', label: 'Orders', Icon: ClipboardList, group: 'ops', permission: PERMISSIONS.VIEW_ORDERS, roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.WAITER] },
  { id: 'kitchen', label: 'Kitchen', Icon: ChefHat, group: 'ops', permission: PERMISSIONS.UPDATE_ORDER_STATUS, roles: [ROLES.KITCHEN, ROLES.MANAGER] },
  { id: 'payments', label: 'Payments', Icon: CreditCard, group: 'ops', permission: PERMISSIONS.VERIFY_PAYMENT, roles: [ROLES.OWNER, ROLES.CASHIER] },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3, group: 'intel', permission: PERMISSIONS.VIEW_REPORTS, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] },
  { id: 'loyalty', label: 'Loyalty', Icon: Star, group: 'intel', roles: [ROLES.OWNER, ROLES.MANAGER] },
  { id: 'notifications', label: 'Notifications', Icon: Bell, group: 'sys', roles: [ROLES.OWNER, ROLES.MANAGER] },
  { id: 'audit', label: 'Audit Log', Icon: ShieldCheck, group: 'sys', permission: PERMISSIONS.VIEW_REPORTS, roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.SUPER_ADMIN] },
  { id: 'settings', label: 'Settings', Icon: Settings, group: 'sys', roles: [ROLES.OWNER, ROLES.MANAGER] },
]

export const groupLabels = { main: '', manage: 'Manage', ops: 'Operations', intel: 'Intel', sys: 'System' }

export const orderStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']

export const roleHome = {
  [ROLES.SUPER_ADMIN]: 'restaurants',
  [ROLES.OWNER]: 'dashboard',
  [ROLES.MANAGER]: 'dashboard',
  [ROLES.WAITER]: 'orders',
  [ROLES.KITCHEN]: 'kitchen',
  [ROLES.CASHIER]: 'payments',
}
