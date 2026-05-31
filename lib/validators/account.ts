import { z } from "zod";
export const accountUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency_code: z.string().length(3).optional(),
  is_archived: z.boolean().optional(),
});
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
