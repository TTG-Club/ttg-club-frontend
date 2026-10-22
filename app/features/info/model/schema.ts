import { z } from 'zod';

/** Информационная страница: заголовок, подзаголовок и HTML из базы. */
export const infoPageSchema = z.object({
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
  description: z.string().nullish(),
});

export type InfoPage = z.infer<typeof infoPageSchema>;
