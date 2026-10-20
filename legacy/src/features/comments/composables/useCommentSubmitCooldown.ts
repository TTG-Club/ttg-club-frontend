import { useUserStore } from '@/shared/stores/UserStore';

import type { ComputedRef } from 'vue';

/**
 * Момент, до которого отправка запрещена (мс эпохи). Состояние модульное, а не
 * локальное: антиспам-лимит сервиса действует на пользователя целиком, поэтому
 * пауза, начатая в одном блоке комментариев, обязана гасить кнопку и в другом
 * (страница и боковая панель живут на экране одновременно).
 */
const cooldownUntil = ref(0);

/** Возвращаемое значение композабла useCommentSubmitCooldown. */
export interface UseCommentSubmitCooldownReturn {
  /** Секунд до следующей разрешённой отправки (0 — можно отправлять). */
  remainingSeconds: ComputedRef<number>;

  /** Идёт ли пауза между отправками. */
  isCoolingDown: ComputedRef<boolean>;

  /** Запускает паузу на указанное число секунд. */
  startCooldown: (seconds: number) => void;
}

/**
 * Пауза антиспам-лимита между отправками комментариев. Модераторов и
 * администраторов сервис не ограничивает — для них пауза не включается.
 */
export function useCommentSubmitCooldown(): UseCommentSubmitCooldownReturn {
  const userStore = useUserStore();

  const { isEditor } = storeToRefs(userStore);

  const currentTimestamp = useTimestamp({ interval: 1000 });

  const remainingSeconds = computed(() =>
    Math.max(
      0,
      Math.ceil((cooldownUntil.value - currentTimestamp.value) / 1000),
    ),
  );

  const isCoolingDown = computed(() => remainingSeconds.value > 0);

  function startCooldown(seconds: number): void {
    if (isEditor.value || seconds <= 0) {
      return;
    }

    cooldownUntil.value = Date.now() + seconds * 1000;
  }

  return {
    remainingSeconds,
    isCoolingDown,
    startCooldown,
  };
}
