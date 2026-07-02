import { z } from "zod";

export const emptyRequestSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
