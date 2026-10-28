import type { ComputedRef } from 'vue';

import { COMMENT_COOLDOWN_STATE_KEY } from '../model';

/** Миллисекунд в секунде. */
const SECOND_MS = 1000;

/** Возвращаемое значение useCommentSubmitCooldown. */
export interface UseCommentSubmitCooldownReturn {
  /** Секунд до следующей отправки; 0 — можно отправлять. */
  remainingSeconds: ComputedRef<number>;

  /** Идёт ли пауза между отправками. */
  isCoolingDown: ComputedRef<boolean>;

  /** Запускает паузу на указанное число секунд. */
  startCooldown: (seconds: number) => void;
}

/**
 * Пауза антиспам-лимита между отправками. Лимит сервиса действует на
 * пользователя целиком, поэтому состояние общее на всё приложение. Редакторов
 * сервис не ограничивает, для них пауза не включается.
 */
export function useCommentSubmitCooldown(): UseCommentSubmitCooldownReturn {
  const cooldownUntil = useState<number>(COMMENT_COOLDOWN_STATE_KEY, () => 0);

  const { isEditor } = useUser();

  const currentTimestamp = useTimestamp({ interval: SECOND_MS });

  const remainingSeconds = computed(() =>
    Math.max(
      0,
      Math.ceil((cooldownUntil.value - currentTimestamp.value) / SECOND_MS),
    ),
  );

  const isCoolingDown = computed(() => remainingSeconds.value > 0);

  function startCooldown(seconds: number): void {
    if (isEditor.value || seconds <= 0) {
      return;
    }

    cooldownUntil.value = Date.now() + seconds * SECOND_MS;
  }

  return {
    remainingSeconds,
    isCoolingDown,
    startCooldown,
  };
}
