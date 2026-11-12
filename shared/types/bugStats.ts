import { z } from 'zod';

/** Охотник за багами: имя для показа, аватар и число исправленных багов. */
const bugFixerSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().nullish(),
  fixed: z.number(),
});

/**
 * Рейтинг охотников за багами, как его отдаёт new.ttg.club: десятка за всё
 * время и десятка за текущий месяц, обе уже отсортированы.
 */
export const bugStatsSchema = z.object({
  topFixers: z.array(bugFixerSchema),
  topFixersThisMonth: z.array(bugFixerSchema),
});

export type BugFixer = z.infer<typeof bugFixerSchema>;

export type BugStats = z.infer<typeof bugStatsSchema>;
