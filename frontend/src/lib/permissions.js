export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  KITCHEN: 'KITCHEN',
  CASHIER: 'CASHIER',
})

export const PERMISSIONS = Object.freeze({
  MANAGE_RESTAURANT: 'manage_restaurant',
  MANAGE_EMPLOYEES: 'manage_employees',
  MANAGE_MENU: 'manage_menu',
  MANAGE_TABLES: 'manage_tables',
  MANAGE_ORDERS: 'manage_orders',
  VIEW_ORDERS: 'view_orders',
  CREATE_ORDER: 'create_order',
  UPDATE_ORDER: 'update_order',
  UPDATE_ORDER_STATUS: 'update_order_status',
  MARK_AS_SERVED: 'mark_as_served',
  VERIFY_PAYMENT: 'verify_payment',
  REFUND_PAYMENT: 'refund_payment',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  MANAGE_ALL_RESTAURANTS: 'manage_all_restaurants',
})

// Mirrors backend requirePermissions(): SUPER_ADMIN always passes, everyone
// else needs the permission in their JWT-issued permissions list.
export function hasPermission(user, permission) {
  if (!permission) return true
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return (user.permissions || []).includes(permission)
}

export function hasRole(user, roles) {
  if (!roles?.length) return true
  return !!user?.role && roles.includes(user.role)
}

export function canSeeNavItem(user, item) {
  return hasRole(user, item.roles) && hasPermission(user, item.permission)
}
