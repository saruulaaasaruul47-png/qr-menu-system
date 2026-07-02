import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { employeeService } from "../services/employee.service.js";

export const listEmployees = asyncHandler(async (req, res) => {
  sendSuccess(res, await employeeService.list(req.user));
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.create(req.user, req.validated.body);
  await auditService.record({
    req,
    action: "EMPLOYEE_CREATED",
    entity: "User",
    entityId: employee.id,
    newValue: employee,
    restaurantId: employee.restaurantId,
  });
  sendSuccess(res, employee, 201);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.update(req.user, req.validated.params.id, req.validated.body);
  await auditService.record({
    req,
    action: "EMPLOYEE_UPDATED",
    entity: "User",
    entityId: employee.id,
    newValue: employee,
    restaurantId: employee.restaurantId,
  });
  sendSuccess(res, employee);
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.remove(req.user, req.validated.params.id);
  await auditService.record({
    req,
    action: "EMPLOYEE_UPDATED",
    entity: "User",
    entityId: employee.id,
    newValue: employee,
    restaurantId: employee.restaurantId,
  });
  sendSuccess(res, employee);
});
