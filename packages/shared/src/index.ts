import { z } from "zod";

export const HealthCheckResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
