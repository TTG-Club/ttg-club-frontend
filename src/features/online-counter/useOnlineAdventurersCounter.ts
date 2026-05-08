import Cookies from 'js-cookie';
import { v7 as uuidv7 } from 'uuid';

import { httpClient } from '@/shared/api';
import { useUserStore } from '@/shared/stores/UserStore';
import { getProxyUrl } from '@/shared/utils/getApiUrl';

const HEARTBEAT_URL = '/api/online/heartbeat';
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const HEARTBEAT_COOLDOWN_MS = 10 * 1000;
const HEARTBEAT_LOCK_NAME = 'ttg-online-heartbeat-leader';
const ONLINE_COUNTER_STORAGE_KEY = 'ttg-online-adventurers-count';
const ONLINE_VISITOR_ID_COOKIE = 'ttg-online-visitor-id';
const ONLINE_VISITOR_ID_COOKIE_EXPIRES_DAYS = 400;
const VISITOR_ONLINE_TYPE = 'GUEST';
const REGISTERED_ONLINE_TYPE = 'REGISTERED';

type OnlineHeartbeatBody = {
  key: string;
  previousGuestKey?: string;
  type: typeof REGISTERED_ONLINE_TYPE | typeof VISITOR_ONLINE_TYPE;
};

type WebLockManager = {
  request(
    name: string,
    callback: (lock: unknown) => Promise<void> | void,
  ): Promise<void>;
};

const adventurersCount = ref(0);
const isAdventurersCounterLoading = ref(false);

let refreshAdventurersCounterHandler:
  | ((force?: boolean) => Promise<void>)
  | null = null;

const isOnlineTotalPayload = (payload: unknown): payload is { total: number } =>
  !!payload &&
  typeof payload === 'object' &&
  'total' in payload &&
  typeof payload.total === 'number' &&
  Number.isFinite(payload.total);

const isWebLockManager = (value: unknown): value is WebLockManager =>
  !!value &&
  typeof value === 'object' &&
  'request' in value &&
  typeof value.request === 'function';

const getWebLockManager = () => {
  const locks = Reflect.get(navigator, 'locks');

  if (!isWebLockManager(locks)) {
    return undefined;
  }

  return locks;
};

const parseOnlineUsersTotal = (payload: unknown): number => {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return Math.max(0, payload);
  }

  if (isOnlineTotalPayload(payload)) {
    return Math.max(0, payload.total);
  }

  return 0;
};

const setAdventurersCount = (count: number) => {
  adventurersCount.value = count;
  localStorage.setItem(ONLINE_COUNTER_STORAGE_KEY, String(count));
};

const restoreAdventurersCount = () => {
  const savedCount = Number(localStorage.getItem(ONLINE_COUNTER_STORAGE_KEY));

  if (Number.isFinite(savedCount)) {
    adventurersCount.value = Math.max(0, savedCount);
  }
};

const syncAdventurersCount = (event: StorageEvent) => {
  if (event.key !== ONLINE_COUNTER_STORAGE_KEY || event.newValue === null) {
    return;
  }

  const count = Number(event.newValue);

  if (Number.isFinite(count)) {
    adventurersCount.value = Math.max(0, count);
  }
};

export const useOnlineAdventurersCounter = () => {
  const refreshAdventurersCounter = () => {
    if (!refreshAdventurersCounterHandler) {
      return Promise.resolve();
    }

    return refreshAdventurersCounterHandler(true);
  };

  return {
    adventurersCount,
    isAdventurersCounterLoading,
    refreshAdventurersCounter,
  };
};

export const useOnlineAdventurersHeartbeat = () => {
  const userStore = useUserStore();
  const { isAuthenticated, user } = storeToRefs(userStore);

  const isLeader = ref(false);
  const usesFallbackHeartbeat = ref(false);

  let lastHeartbeatTime = 0;
  let stopLock: (() => void) | null = null;

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
          type: REGISTERED_ONLINE_TYPE,
        };
      }

      return {
        key: user.value.username,
        type: REGISTERED_ONLINE_TYPE,
      };
    }

    return {
      key: getVisitorId(),
      type: VISITOR_ONLINE_TYPE,
    };
  };

  const sendHeartbeat = async (force = false) => {
    const now = Date.now();

    if (!force && now - lastHeartbeatTime < HEARTBEAT_COOLDOWN_MS) {
      return;
    }

    lastHeartbeatTime = now;

    isAdventurersCounterLoading.value = true;

    try {
      const body = await getHeartbeatBody();

      const response = await httpClient.instance<unknown>({
        baseURL: getProxyUrl(),
        data: body,
        method: 'post',
        url: HEARTBEAT_URL,
      });

      setAdventurersCount(parseOnlineUsersTotal(response.data));
    } catch {
      // Keep the last known value when the heartbeat endpoint is unavailable.
    } finally {
      isAdventurersCounterLoading.value = false;
    }
  };

  const { pause, resume } = useIntervalFn(
    () => {
      if (
        usesFallbackHeartbeat.value &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      sendHeartbeat().then(undefined);
    },
    HEARTBEAT_INTERVAL_MS,
    { immediate: false },
  );

  const startFallbackHeartbeat = () => {
    usesFallbackHeartbeat.value = true;

    resume();

    if (document.visibilityState === 'visible') {
      sendHeartbeat(true).then(undefined);
    }
  };

  const start = () => {
    restoreAdventurersCount();
    window.addEventListener('storage', syncAdventurersCount);

    const locks = getWebLockManager();

    if (!locks) {
      startFallbackHeartbeat();

      return;
    }

    locks
      .request(HEARTBEAT_LOCK_NAME, async (lock) => {
        if (!lock) {
          return;
        }

        isLeader.value = true;
        usesFallbackHeartbeat.value = false;

        resume();
        sendHeartbeat(true).then(undefined);

        await new Promise<void>((resolve) => {
          stopLock = resolve;
        });

        isLeader.value = false;
        usesFallbackHeartbeat.value = false;
        pause();
      })
      .then(undefined);
  };

  const stop = () => {
    window.removeEventListener('storage', syncAdventurersCount);

    if (stopLock) {
      stopLock();
      stopLock = null;
    }

    pause();
    usesFallbackHeartbeat.value = false;
  };

  refreshAdventurersCounterHandler = async (force = false) => {
    if (getWebLockManager() && !isLeader.value) {
      return;
    }

    await sendHeartbeat(force);
  };

  onMounted(start);

  onUnmounted(() => {
    stop();

    refreshAdventurersCounterHandler = null;
  });

  return {
    adventurersCount,
    isAdventurersCounterLoading,
    sendHeartbeat,
    start,
    stop,
  };
};
