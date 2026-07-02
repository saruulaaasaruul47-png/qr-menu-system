import { Router } from "express";
import { authenticate } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { addPoints, deleteLoyaltyData, lookupLoyalty, publicLookup } from "../controllers/loyalty.controller.js";
import { addPointsSchema, deleteLoyaltyDataSchema, lookupLoyaltySchema, publicLookupSchema } from "../schemas/loyalty.schema.js";

export const loyaltyRouter = Router();

loyaltyRouter.post("/points", validate(addPointsSchema), addPoints);
loyaltyRouter.get("/public", validate(publicLookupSchema), publicLookup);
loyaltyRouter.get("/", authenticate, validate(lookupLoyaltySchema), lookupLoyalty);
loyaltyRouter.delete("/personal-data", authenticate, validate(deleteLoyaltyDataSchema), deleteLoyaltyData);
