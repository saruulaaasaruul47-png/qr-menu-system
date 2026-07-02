import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { qrService } from "../services/qr.service.js";

export const createQr = asyncHandler(async (req, res) => {
  sendSuccess(res, await qrService.create(req.user, req.validated.body), 201);
});

export const createTableQr = asyncHandler(async (req, res) => {
  sendSuccess(res, await qrService.createForTable(req.user, req.validated.params.tableId), 201);
});

export const scanQr = asyncHandler(async (req, res) => {
  sendSuccess(res, await qrService.scan(req.validated.params.id, req.validated.query?.guestSessionId));
});

export const listQrScans = asyncHandler(async (req, res) => {
  sendSuccess(res, await qrService.listScans(req.user, req.validated.query));
});
