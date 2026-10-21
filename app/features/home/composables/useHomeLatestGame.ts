import type { ComputedRef } from 'vue';

import type { HomeDisplayName, HomeGame, HomeGameSystem } from '../model';

import {
  findLatestGame,
  HOME_LATEST_GAME_API_URL,
  HOME_LATEST_GAME_DATA_KEY,
  HOME_LATEST_GAME_LOOKUP_SIZE,
  HOME_LATEST_GAME_NAMES_API_URL,
  HOME_LATEST_GAME_SYSTEMS_API_URL,
  parseHomeDisplayNames,
  parseHomeGames,
  parseHomeGameSystems,
} from '../model';

/** Самая свежая игра вместе с тем, что о ней знают другие сервисы */
interface HomeLatestGameData {
  game: HomeGame;
  /** Мастер; `undefined` — имя не пришло */
  master: HomeDisplayName | undefined;
  /** Название системы из справочника; `undefined` — справочник не пришёл */
  systemName: string | undefined;
}

interface HomeLatestGame {
  latestGame: ComputedRef<HomeLatestGameData | undefined>;
  isLoading: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
}

/**
 * Имя мастера: сервис игр знает только идентификатор, имя — в core-api.
 * Без имени карточка всё равно рабочая, поэтому ошибка гасится.
 *
 * @param masterId - идентификатор мастера
 * @returns имя и аватар мастера или `undefined`
 */
async function fetchMaster(
  masterId: string,
): Promise<HomeDisplayName | undefined> {
  try {
    const names = parseHomeDisplayNames(
      await $fetch(HOME_LATEST_GAME_NAMES_API_URL, {
        method: 'POST',
        body: { userIds: [masterId] },
      }),
    );

    return names.find((name) => name.userId === masterId);
  } catch {
    return undefined;
  }
}

/**
 * Справочник систем: названия берём из сервиса игр, чтобы новые системы
 * показывались на главной сразу после их добавления.
 *
 * @returns системы; пустой список — справочник не загрузился
 */
async function fetchGameSystems(): Promise<Array<HomeGameSystem>> {
  try {
    return parseHomeGameSystems(await $fetch(HOME_LATEST_GAME_SYSTEMS_API_URL));
  } catch {
    return [];
  }
}

/**
 * Самая свежая игра каталога: первая страница, из неё — игра с самой поздней
 * датой создания, к ней имя мастера и название системы.
 *
 * @returns игра с мастером и системой или `undefined`, если игр нет
 */
async function fetchLatestGame(): Promise<HomeLatestGameData | undefined> {
  const game = findLatestGame(
    parseHomeGames(
      await $fetch(HOME_LATEST_GAME_API_URL, {
        query: { page: 0, size: HOME_LATEST_GAME_LOOKUP_SIZE },
      }),
    ),
  );

  if (!game) {
    return undefined;
  }

  const [master, systems] = await Promise.all([
    fetchMaster(game.masterId),
    fetchGameSystems(),
  ]);

  return {
    game,
    master,
    systemName: systems.find((system) => system.code === game.system)?.name,
  };
}

/**
 * Последняя игра из каталога new.ttg.club. Сервисы игр и пользователей живут
 * на других доменах, поэтому карточка грузится только в браузере: серверу
 * незачем ждать чужие сервисы ради необязательного блока.
 *
 * @returns игра, загрузка и ошибка каталога
 */
export function useHomeLatestGame(): HomeLatestGame {
  const { data, status } = useAsyncData(
    HOME_LATEST_GAME_DATA_KEY,
    fetchLatestGame,
    { server: false, lazy: true },
  );

  const latestGame = computed(() => data.value ?? undefined);

  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const hasError = computed(() => status.value === 'error');

  return { latestGame, isLoading, hasError };
}
