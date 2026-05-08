import { z } from 'zod';

export const LEAN_COFFEE_DEFAULT_DURATIONS_SEC = [480, 300] as const;

export const leanCoffeeSchema = z.object({
  durations: z
    .string()
    .optional()
    .transform((s, ctx) => {
      if (s == null || s.trim() === '') {
        return [...LEAN_COFFEE_DEFAULT_DURATIONS_SEC];
      }
      const parts = s
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (parts.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'at least one duration is required',
        });
        return z.NEVER;
      }
      const nums = parts.map((p) => Number(p));
      if (nums.some((n) => !Number.isInteger(n) || n <= 0)) {
        ctx.addIssue({
          code: 'custom',
          message: 'durations must be positive integers (seconds)',
        });
        return z.NEVER;
      }
      return nums;
    }),
  selected: z.coerce.number().int().positive().optional(),
  room: z.string().min(1).optional(),
  readonly: z
    .string()
    .optional()
    .transform((s) => s === 'true' || s === '1'),
});

export type LeanCoffeeParams = z.infer<typeof leanCoffeeSchema>;
