import bcrypt from "bcrypt";
import { prisma } from "../../../../shared/config/prisma.js";
import { env } from "../../../../shared/config/env.js";
import { cache } from "../../../../shared/utils/cache.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess } from "../../../../shared/utils/tenant.js";

const safeUser = (user) => {
  const { password, ...publicUser } = user;
  return publicUser;
};

const normalizePermissions = (role, permissions) => {
  const allowed = Object.values(PERMISSIONS);
  const selected = permissions?.length ? permissions : DEFAULT_ROLE_PERMISSIONS[role] || [];
  return selected.filter((permission) => allowed.includes(permission));
};

const tenantWhere = (currentUser) =>
  currentUser.role === ROLES.SUPER_ADMIN ? {} : { restaurantId: currentUser.restaurantId };

const ensureSuperAdminActor = (currentUser) => {
  if (currentUser.role !== ROLES.SUPER_ADMIN) {
    throw new HttpError(403, "Only super admin can manage super admins");
  }
};

export const employeeService = {
  async list(currentUser) {
    const employees = await prisma.user.findMany({
      where: tenantWhere(currentUser),
      orderBy: { createdAt: "desc" },
    });

    return employees.map(safeUser);
  },

  async create(currentUser, payload) {
    if (payload.role === ROLES.SUPER_ADMIN) {
      ensureSuperAdminActor(currentUser);
    }

    const restaurantId =
      payload.role === ROLES.SUPER_ADMIN
        ? null
        : currentUser.role === ROLES.SUPER_ADMIN
          ? payload.restaurantId
          : currentUser.restaurantId;

    if (payload.role !== ROLES.SUPER_ADMIN && !restaurantId) {
      throw new HttpError(400, "restaurantId is required");
    }
    if (restaurantId) ensureTenantAccess(currentUser, restaurantId);

    const exists = await prisma.user.findUnique({ where: { email: payload.email } });
    if (exists) throw new HttpError(409, "Email is already registered");

    const employee = await prisma.user.create({
      data: {
        restaurantId,
        name: payload.name,
        email: payload.email,
        password: await bcrypt.hash(payload.password, env.bcryptSaltRounds),
        role: payload.role,
        permissions: normalizePermissions(payload.role, payload.permissions),
      },
    });

    return safeUser(employee);
  },

  async update(currentUser, employeeId, payload) {
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) throw new HttpError(404, "Employee not found");
    if (employee.role === ROLES.SUPER_ADMIN || payload.role === ROLES.SUPER_ADMIN) {
      throw new HttpError(403, "Super admins can only be added or removed");
    }
    ensureTenantAccess(currentUser, employee.restaurantId);

    const role = payload.role || employee.role;
    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: {
        name: payload.name,
        role: payload.role,
        permissions: payload.permissions || payload.role ? normalizePermissions(role, payload.permissions) : undefined,
        isActive: payload.isActive,
      },
    });

    cache.del(`auth:user:${employeeId}`);
    return safeUser(updated);
  },

  async remove(currentUser, employeeId) {
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) throw new HttpError(404, "Employee not found");
    if (employee.id === currentUser.id) throw new HttpError(400, "You cannot remove your own account");
    if (employee.role === ROLES.SUPER_ADMIN) {
      ensureSuperAdminActor(currentUser);
    }
    ensureTenantAccess(currentUser, employee.restaurantId);

    const updated = await prisma.user.update({ where: { id: employeeId }, data: { isActive: false } });
    cache.del(`auth:user:${employeeId}`);

    return safeUser(updated);
  },
};
