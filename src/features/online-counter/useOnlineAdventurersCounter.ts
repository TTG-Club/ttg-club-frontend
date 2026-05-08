import Cookies from 'js-cookie';
import { v7 as uuidv7 } from 'uuid';

import { useUserStore } from '@/shared/stores/UserStore';

const ONLINE_API_URL = import.meta.env.VITE_APP_ONLINE_API_URL || '';
const ONLINE_SITE_ID = import.meta.env.VITE_APP_ONLINE_SITE_ID || '';
const HEARTBEAT_PATH = '/api/v1/online/heartbeat';
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const HEARTBEAT_COOLDOWN_MS = 10 * 1000;
const ONLINE_VISITOR_ID_COOKIE = 'ttg-online-visitor-id';
const ONLINE_VISITOR_ID_COOKIE_EXPIRES_DAYS = 400;
const VISITOR_ONLINE_TYPE = 'GUEST';
const REGISTERED_ONLINE_TYPE = 'REGISTERED';

type OnlineHeartbeatBody = {
  key: string;
  previousGuestKey?: string;
  siteId: string;
  type: typeof REGISTERED_ONLINE_TYPE | typeof VISITOR_ONLINE_TYPE;
};

const adventurersCount = ref(0);
const isAdventurersCounterLoading = ref(false);

const isOnlineTotalPayload = (payload: unknown): payload is { total: number } =>
  !!payload &&
  typeof payload === 'object' &&
  'total' in payload &&
  typeof payload.total === 'number' &&
  Number.isFinite(payload.total);

const getOnlineApiUrl = () => ONLINE_API_URL.replace(/\/$/, '');

const isOnlineCounterConfigured = () => !!getOnlineApiUrl() && !!ONLINE_SITE_ID;

const parseOnlineUsersTotal = (payload: unknown): number => {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return Math.max(0, payload);
  }

  if (isOnlineTotalPayload(payload)) {
    return Math.max(0, payload.total);
  }

  return 0;
};

export const useOnlineAdventurersCounter = () => {
  return {
    adventurersCount,
    isAdventurersCounterLoading,
  };
};

export const useOnlineAdventurersHeartbeat = () => {
  const userStore = useUserStore();
  const { isAuthenticated, user } = storeToRefs(userStore);

  let lastHeartbeatTime = 0;

  const getVisitorId = () => {
    const visitorId = Cookies.get(ONLINE_VISITOR_ID_COOKIE);

    if (visitorId) {
      return visitorId;
    }

    const newVisitorId = uuidv7();

    Cookies.set(ONLINE_VISITOR_ID_COOKIE, newVisitorId, {
      expires: ONLINE_VISITOR_ID_COOKIE_EXPIRES_DAYS,
      path: '/',
      sameSite: 'lax',
    });

    return newVisitorId;
  };

  const getHeartbeatBody = async (): Promise<OnlineHeartbeatBody> => {
    if (userStore.getUserToken() && !user.value) {
      try {
        await userStore.getUserInfo();
      } catch {
        // Visitor heartbeat is enough when profile data is unavailable.
      }
    }

    if (isAuthenticated.value && user.value?.username) {
      const previousGuestKey = Cookies.get(ONLINE_VISITOR_ID_COOKIE);

      if (previousGuestKey) {
        return {
          key: user.value.username,
          previousGuestKey,
          siteId: ONLINE_SITE_ID,
          type: REGISTERED_ONLINE_TYPE,
        };
      }

      return {
        key: user.value.username,
        siteId: ONLINE_SITE_ID,
        type: REGISTERED_ONLINE_TYPE,
      };
    }

    return {
      key: getVisitorId(),
      siteId: ONLINE_SITE_ID,
      type: VISITOR_ONLINE_TYPE,
    };
  };

  const sendHeartbeat = async (force = false) => {
    if (!isOnlineCounterConfigured()) {
      return;
    }

    const now = Date.now();

    if (!force && now - lastHeartbeatTime < HEARTBEAT_COOLDOWN_MS) {
      return;
    }

    lastHeartbeatTime = now;

    isAdventurersCounterLoading.value = true;

    try {
      const body = await getHeartbeatBody();

      const response = await fetch(`${getOnlineApiUrl()}${HEARTBEAT_PATH}`, {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      if (!response.ok) {
        return;
      }

      adventurersCount.value = parseOnlineUsersTotal(await response.json());
    } catch {
      // Keep the last known value when the heartbeat endpoint is unavailable.
    } finally {
      isAdventurersCounterLoading.value = false;
    }
  };

  const { pause, resume } = useIntervalFn(
    () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      sendHeartbeat().then(undefined);
    },
    HEARTBEAT_INTERVAL_MS,
    { immediate: false },
  );

  const start = () => {
    resume();

    sendHeartbeat(true).then(undefined);
  };

  const stop = () => {
    pause();
  };

  onMounted(start);
  onUnmounted(stop);

  return {
    adventurersCount,
    isAdventurersCounterLoading,
    sendHeartbeat,
    start,
    stop,
  };
};
