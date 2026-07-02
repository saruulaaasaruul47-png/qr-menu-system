import { Router } from "express";
import { authenticate } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { sendEmail } from "../controllers/email.controller.js";
import { sendEmailSchema } from "../schemas/email.schema.js";

export const emailRouter = Router();

emailRouter.post("/", authenticate, validate(sendEmailSchema), sendEmail);
