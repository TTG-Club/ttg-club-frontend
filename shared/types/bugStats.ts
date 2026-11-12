import { z } from 'zod';

/** Охотник за багами: имя для показа, аватар и число исправленных багов. */
const bugFixerSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().nullish(),
  fixed: z.number(),
});

/**
 * Статистика багов, как её отдаёт new.ttg.club: сколько багов исправлено
 * всего и рейтинг охотников — десятка за всё время и десятка за текущий
 * месяц, обе уже отсортированы.
 */
export const bugStatsSchema = z.object({
  // Необязательное: браузер может держать в кеше ответ прежнего состава, без
  // этого числа, — рейтинг из него всё равно годен
  fixedCount: z.number().optional(),
  topFixers: z.array(bugFixerSchema),
  topFixersThisMonth: z.array(bugFixerSchema),
});

export type BugFixer = z.infer<typeof bugFixerSchema>;

export type BugStats = z.infer<typeof bugStatsSchema>;
