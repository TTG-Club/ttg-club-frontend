import type { ComputedRef } from 'vue';
import type { GraphicsMode } from '~/shared/consts';

import { z } from 'zod';

import {
  GRAPHICS_MODE_COOKIE,
  GRAPHICS_MODE_COOKIE_MAX_AGE_SECONDS,
  GRAPHICS_MODE_DEFAULT,
  GRAPHICS_MODES,
} from '~/shared/consts';

/** В cookie может попасть что угодно — принимаем только известные режимы. */
const graphicsModeSchema = z.enum(GRAPHICS_MODES);

export interface UseGraphicsModeReturn {
  /** Действующий режим графики */
  mode: ComputedRef<GraphicsMode>;
  /** Режим уже выбран — посетителем или самим сайтом после замера */
  isChosen: ComputedRef<boolean>;
  /** Меняет режим графики и запоминает его */
  setMode: (value: GraphicsMode) => void;
}

/**
 * Режим графики сайта: «красота» с размытием фона или «производительность»
 * без него. В cookie — чтобы сервер сразу отдал страницу в нужном режиме.
 * Пока cookie нет, действует «красота», а сайт замеряет плавность анимаций
 * (`useGraphicsProbe`).
 *
 * @returns Режим, признак сделанного выбора и смена режима
 */
export function useGraphicsMode(): UseGraphicsModeReturn {
  const cookie = useCookie<unknown>(GRAPHICS_MODE_COOKIE, {
    maxAge: GRAPHICS_MODE_COOKIE_MAX_AGE_SECONDS,
  });

  const savedMode = computed(
    () => graphicsModeSchema.safeParse(cookie.value).data,
  );

  const mode = computed<GraphicsMode>(
    () => savedMode.value ?? GRAPHICS_MODE_DEFAULT,
  );

  const isChosen = computed(() => savedMode.value !== undefined);

  /**
   * Запоминает режим графики в cookie.
   * @param value - Новый режим
   */
  function setMode(value: GraphicsMode): void {
    cookie.value = value;
  }

  return { mode, isChosen, setMode };
}
