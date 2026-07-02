import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { emailService } from "../services/email.service.js";

export const sendEmail = asyncHandler(async (req, res) => {
  sendSuccess(res, await emailService.send(req.validated.body), 202);
});
