import { ROLES } from "../constants/permissions.js";
import { HttpError } from "./httpError.js";

export const resolveRestaurantId = (user, requestedRestaurantId) =>
  user.role === ROLES.SUPER_ADMIN ? requestedRestaurantId : user.restaurantId;

export const ensureTenantAccess = (user, restaurantId) => {
  if (user.role !== ROLES.SUPER_ADMIN && user.restaurantId !== restaurantId) {
    throw new HttpError(403, "Cross-tenant access is not allowed");
  }
};

export const scopedRestaurantWhere = (restaurantId) => (restaurantId ? { restaurantId } : {});
