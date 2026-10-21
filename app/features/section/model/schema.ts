import { z } from 'zod';

const filterValueSchema = z.object({
  label: z.string(),
  key: z.union([z.string(), z.number()]),
  default: z.boolean().nullish(),
  tooltip: z.string().nullish(),
});

const filterGroupSchema = z.object({
  name: z.string().nullish(),
  key: z.string(),
  hidden: z.boolean().nullish(),
  values: z.array(filterValueSchema).nullish(),
});

/** Ответ ручки фильтра: объект с источниками или просто список групп. */
export const filterResponseSchema = z.union([
  z.object({
    sources: z.array(filterGroupSchema).nullish(),
    other: z.array(filterGroupSchema).nullish(),
  }),
  z.array(filterGroupSchema),
]);

export type FilterResponse = z.infer<typeof filterResponseSchema>;
export type FilterGroupResponse = z.infer<typeof filterGroupSchema>;
