import type { OnlineHeartbeatBody } from '../model';

import {
  ONLINE_VISITOR_ID_COOKIE,
  ONLINE_VISITOR_ID_MAX_AGE_SECONDS,
} from '#shared/consts';

import {
  getGuestHeartbeatBody,
  getRegisteredHeartbeatBody,
  parseOnlineVisitorId,
} from '../model';

/**
 * Кем посетитель представляется сервису онлайна. Вошедший — логином, гость —
 * случайным идентификатором из cookie; гостю без cookie идентификатор выдаётся
 * при первом обращении.
 *
 * Состояние общее: отметки онлайна и учёт работы с инструментами читают одну и
 * ту же cookie, иначе новый гость получил бы два идентификатора и стал двумя
 * людьми.
 */
export const useOnlineVisitor = createSharedComposable(() => {
  const { user } = useUser();

  const visitorIdCookie = useCookie<unknown>(ONLINE_VISITOR_ID_COOKIE, {
    maxAge: ONLINE_VISITOR_ID_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  /** Возвращает логин вошедшего или идентификатор гостя, выдавая его при нужде. */
  function getVisitor(): OnlineHeartbeatBody {
    const saved = parseOnlineVisitorId(visitorIdCookie.value);
    const username = user.value?.username;

    if (username) {
      return getRegisteredHeartbeatBody(username, saved);
    }

    const visitorId = saved ?? crypto.randomUUID();

    visitorIdCookie.value = visitorId;

    return getGuestHeartbeatBody(visitorId);
  }

  return { getVisitor };
});
