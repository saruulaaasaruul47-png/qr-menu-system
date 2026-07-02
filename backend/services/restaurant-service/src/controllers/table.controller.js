import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { tableService } from "../services/table.service.js";

export const listTables = asyncHandler(async (req, res) => {
  sendSuccess(res, await tableService.list(req.user));
});

export const createTable = asyncHandler(async (req, res) => {
  const table = await tableService.create(req.user, req.validated.body);
  const firstTable = Array.isArray(table) ? table[0] : table;
  await auditService.record({ req, action: "TABLE_CREATED", entity: "Table", entityId: firstTable?.id, newValue: table, restaurantId: firstTable?.restaurantId });
  sendSuccess(res, table, 201);
});

export const updateTable = asyncHandler(async (req, res) => {
  const table = await tableService.update(req.user, req.validated.params.id, req.validated.body);
  await auditService.record({ req, action: "TABLE_UPDATED", entity: "Table", entityId: table.id, newValue: table, restaurantId: table.restaurantId });
  sendSuccess(res, table);
});

export const deleteTable = asyncHandler(async (req, res) => {
  sendSuccess(res, await tableService.remove(req.user, req.validated.params.id));
});
