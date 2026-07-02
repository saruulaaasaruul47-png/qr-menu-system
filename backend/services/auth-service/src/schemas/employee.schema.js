import { z } from "zod";
import { ROLES } from "../../../../shared/constants/permissions.js";

const roleValues = Object.values(ROLES);

export const createEmployeeSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    name: z.string().min(2).max(100),
    email: z.string().email().toLowerCase(),
    password: z.string().min(8),
    role: z.enum(roleValues),
    permissions: z.array(z.string()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.enum(roleValues).optional(),
    permissions: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const employeeIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
