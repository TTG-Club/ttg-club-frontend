import type { OnlineHeartbeatBody } from '../model';

import { consola } from 'consola';

import {
  ONLINE_VISITOR_ID_COOKIE,
  ONLINE_VISITOR_ID_MAX_AGE_SECONDS,
} from '#shared/consts';
import { ONLINE_HEARTBEAT_PATH } from '~/shared/consts';

import {
  getGuestHeartbeatBody,
  getRegisteredHeartbeatBody,
  ONLINE_HEARTBEAT_COOLDOWN_MS,
  ONLINE_HEARTBEAT_INTERVAL_MS,
  ONLINE_HEARTBEAT_LOCK_NAME,
  parseOnlineVisitorId,
} from '../model';

/**
 * Отмечает посетителя онлайн, как старый SPA. Отмечает одна вкладка сайта:
 * она держит блокировку, а без поддержки блокировок отмечает каждая видимая
 * вкладка. Число посетителей на сайте не показывается, отметка нужна для
 * статистики.
 */
export function useOnlineHeartbeat(): void {
  const { user } = useUser();
  const visibility = useDocumentVisibility();

  const visitorIdCookie = useCookie<unknown>(ONLINE_VISITOR_ID_COOKIE, {
    maxAge: ONLINE_VISITOR_ID_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  let isLeader = false;
  let isSending = false;
  let lastSentAt = Number.NEGATIVE_INFINITY;

  /** Тело отметки; гостю при первой отметке выдаётся идентификатор. */
  function getBody(): OnlineHeartbeatBody {
    const saved = parseOnlineVisitorId(visitorIdCookie.value);
    const username = user.value?.username;

    if (username) {
      return getRegisteredHeartbeatBody(username, saved);
    }

    const visitorId = saved ?? crypto.randomUUID();

    visitorIdCookie.value = visitorId;

    return getGuestHeartbeatBody(visitorId);
  }

  /**
   * Отправляет одну отметку.
   * @param isForced - без паузы между отметками, например после входа
   */
  async function send(isForced = false): Promise<void> {
    const canSend = navigator.locks ? isLeader : visibility.value === 'visible';

    if (
      !canSend
      || isSending
      || (!isForced && Date.now() - lastSentAt < ONLINE_HEARTBEAT_COOLDOWN_MS)
    ) {
      return;
    }

    isSending = true;
    lastSentAt = Date.now();

    try {
      await $fetch(ONLINE_HEARTBEAT_PATH, {
        method: 'POST',
        body: getBody(),
        retry: 0,
      });
    } catch (error) {
      consola.warn('Не удалось отметить посетителя онлайн', error);
    } finally {
      isSending = false;
    }
  }

  function tick(): void {
    void send();
  }

  const { resume } = useIntervalFn(tick, ONLINE_HEARTBEAT_INTERVAL_MS, {
    immediate: false,
    immediateCallback: true,
  });

  /** Ждёт блокировку и держит её, пока вкладка открыта. */
  function start(): void {
    if (!navigator.locks) {
      resume();

      return;
    }

    void navigator.locks.request(ONLINE_HEARTBEAT_LOCK_NAME, () => {
      isLeader = true;
      resume();

      // Блокировка держится до закрытия вкладки
      return new Promise<never>(() => {});
    });
  }

  watch(visibility, (current) => {
    if (current === 'visible') {
      tick();
    }
  });

  // Вход и выход отмечаются сразу, чтобы гость и аккаунт не считались дважды
  watch(
    () => user.value?.username,
    () => {
      void send(true);
    },
  );

  onNuxtReady(start);
}
