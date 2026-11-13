import type { FeatureUsageBody } from '../model';

import { USER_SESSION_MARKER_COOKIE } from '#shared/consts';
import { FEATURE_USAGE_PATH } from '~/shared/consts';

import {
  FEATURE_USAGE_ACTIVITY_EVENTS,
  FEATURE_USAGE_IDLE_MS,
  FEATURE_USAGE_OPENED_SECONDS,
  FEATURE_USAGE_REPORT_SECONDS,
  FEATURE_USAGE_SAMPLE_MS,
  FEATURE_USAGE_SAMPLE_SECONDS,
  FEATURE_USAGE_SESSION_WAIT_MS,
  isFeatureUsageRejected,
} from '../model';
import { useOnlineVisitor } from './useOnlineVisitor';

/**
 * Учитывает работу посетителя с инструментом сайта, пока жива его страница.
 * Открытие отмечается сразу, а время копится, только когда вкладка на экране и
 * посетитель недавно что-то делал на странице: забытая вкладка и вкладка в фоне
 * не считаются. Сколько времени превращает открытие в «пользовался», решает
 * сервис учёта — сюда порог не зашит.
 *
 * Отмечает каждая вкладка с инструментом сама, в отличие от отметок онлайна.
 *
 * Побочные действия: запросы к сервису учёта раз в минуту работы и при уходе
 * со страницы, слушатели действий посетителя на окне.
 *
 * @param feature - имя инструмента, под которым его знает сервис учёта
 */
export function useFeatureUsage(feature: string): void {
  const api = useApi();

  const { getVisitor } = useOnlineVisitor();
  const { user } = useUser();
  const visibility = useDocumentVisibility();

  const sessionMarker = useCookie<string | null>(USER_SESSION_MARKER_COOKIE, {
    readonly: true,
  });

  let lastActivityTime: number | undefined;
  let pendingSeconds = 0;
  let isRejected = false;

  /**
   * Отправляет отметку. Сбой учёта посетителю не показывается: статистика не
   * должна мешать работе с инструментом.
   * @param activeSeconds - сколько секунд работы накопилось
   * @param isLeaving - страницу прячут или закрывают: запрос должен её пережить
   */
  async function report(
    activeSeconds: number,
    isLeaving = false,
  ): Promise<void> {
    if (isRejected) {
      return;
    }

    try {
      // Сессия могла ещё не восстановиться: без профиля вошедший ушёл бы в учёт
      // гостем. При уходе со страницы ждать некогда — запрос оборвётся.
      refreshCookie(USER_SESSION_MARKER_COOKIE);

      if (!isLeaving && !user.value && sessionMarker.value) {
        await until(user).toBeTruthy({
          timeout: FEATURE_USAGE_SESSION_WAIT_MS,
        });
      }

      const { key, type } = getVisitor();
      const body: FeatureUsageBody = { activeSeconds, feature, key, type };

      await api(FEATURE_USAGE_PATH, {
        method: 'POST',
        body,
        keepalive: isLeaving,
      });
    } catch (error) {
      isRejected = isFeatureUsageRejected(error);
    }
  }

  /** Запоминает, что посетитель только что что-то сделал на странице. */
  function markActivity(): void {
    lastActivityTime = Date.now();
  }

  /**
   * Отправляет накопленное время, если оно есть.
   * @param isLeaving - страницу прячут или закрывают
   */
  function flush(isLeaving = false): void {
    if (!pendingSeconds) {
      return;
    }

    const activeSeconds = pendingSeconds;

    pendingSeconds = 0;
    void report(activeSeconds, isLeaving);
  }

  /** Засчитывает прошедший шаг, если посетитель работал, и раз в минуту шлёт итог. */
  function sample(): void {
    const isWorking =
      visibility.value === 'visible'
      && lastActivityTime !== undefined
      && Date.now() - lastActivityTime < FEATURE_USAGE_IDLE_MS;

    if (!isWorking) {
      return;
    }

    pendingSeconds += FEATURE_USAGE_SAMPLE_SECONDS;

    if (pendingSeconds >= FEATURE_USAGE_REPORT_SECONDS) {
      flush();
    }
  }

  /** Отправляет остаток перед тем, как вкладку спрячут или закроют. */
  function flushOnLeave(): void {
    flush(true);
  }

  const { resume } = useIntervalFn(sample, FEATURE_USAGE_SAMPLE_MS, {
    immediate: false,
  });

  // Фаза перехвата: окна инструмента гасят всплытие своих событий
  useEventListener(FEATURE_USAGE_ACTIVITY_EVENTS, markActivity, {
    capture: true,
    passive: true,
  });

  // Вкладку спрятали или закрыли: остаток минуты иначе пропал бы
  watch(visibility, (current) => {
    if (current === 'hidden') {
      flushOnLeave();
    }
  });

  useEventListener('pagehide', flushOnLeave);

  onMounted(() => {
    void report(FEATURE_USAGE_OPENED_SECONDS);
    resume();
  });

  // Переход на другую страницу сайта: вкладка остаётся, а работа с инструментом кончилась
  onBeforeUnmount(() => {
    flush();
  });
}
