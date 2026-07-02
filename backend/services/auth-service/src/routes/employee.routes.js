import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { emptyRequestSchema } from "../../../../shared/schemas/request.schema.js";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "../controllers/employee.controller.js";
import { createEmployeeSchema, employeeIdSchema, updateEmployeeSchema } from "../schemas/employee.schema.js";
import { login } from "../controllers/auth.controller.js";

export const employeeRouter = Router();

employeeRouter.use(authenticate);

employeeRouter.get("/", requirePermissions(PERMISSIONS.MANAGE_EMPLOYEES), validate(emptyRequestSchema), listEmployees);
employeeRouter.post("/", requirePermissions(PERMISSIONS.MANAGE_EMPLOYEES), validate(createEmployeeSchema), createEmployee);
employeeRouter.patch(
  "/:id",
  requirePermissions(PERMISSIONS.MANAGE_EMPLOYEES),
  validate(updateEmployeeSchema),
  updateEmployee,
);
employeeRouter.delete(
  "/:id",
  requirePermissions(PERMISSIONS.MANAGE_EMPLOYEES),
  validate(employeeIdSchema),
  deleteEmployee,
);
