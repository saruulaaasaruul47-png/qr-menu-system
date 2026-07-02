import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { emptyRequestSchema } from "../../../../shared/schemas/request.schema.js";
import { createTable, deleteTable, listTables, updateTable } from "../controllers/table.controller.js";
import { createTableSchema, tableIdSchema, updateTableSchema } from "../schemas/table.schema.js";

export const tableRouter = Router();

tableRouter.use(authenticate);
tableRouter.get("/", requirePermissions(PERMISSIONS.MANAGE_TABLES), validate(emptyRequestSchema), listTables);
tableRouter.post("/", requirePermissions(PERMISSIONS.MANAGE_TABLES), validate(createTableSchema), createTable);
tableRouter.patch("/:id", requirePermissions(PERMISSIONS.MANAGE_TABLES), validate(updateTableSchema), updateTable);
tableRouter.delete("/:id", requirePermissions(PERMISSIONS.MANAGE_TABLES), validate(tableIdSchema), deleteTable);
