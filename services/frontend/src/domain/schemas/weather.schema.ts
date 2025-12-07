import { z } from 'zod';

export const weatherFilterSchema = z.object({
  city: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().default(1),
  ).optional(),
  limit: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().min(1).max(100).default(50),
  ).optional(),
});

export type WeatherFilterSchema = z.infer<typeof weatherFilterSchema>;
