<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import HomePanel from './HomePanel.vue';
  import {
    HOME_LATEST_GAME_ALL_LABEL,
    HOME_LATEST_GAME_API_URL,
    HOME_LATEST_GAME_CATALOG_URL,
    HOME_LATEST_GAME_EMPTY_TEXT,
    HOME_LATEST_GAME_ERROR_TEXT,
    HOME_LATEST_GAME_ICON,
    HOME_LATEST_GAME_LABEL,
    HOME_LATEST_GAME_LOOKUP_SIZE,
    HOME_LATEST_GAME_SITE_URL,
    HOME_LATEST_GAME_TYPE_LABELS,
    parseHomeGames,
  } from './model';

  import type { HomeGame } from './model';

  const latestGame = ref<HomeGame | null>(null);
  const isLoading = ref(true);
  const hasError = ref(false);

  const gameUrl = computed(() =>
    latestGame.value
      ? `${HOME_LATEST_GAME_CATALOG_URL}/${latestGame.value.id}`
      : HOME_LATEST_GAME_CATALOG_URL,
  );

  const coverUrl = computed(() => {
    const imageUrl = latestGame.value?.imageUrl;

    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('/')) {
      return `${HOME_LATEST_GAME_SITE_URL}${imageUrl}`;
    }

    return /^https?:\/\//.test(imageUrl) ? imageUrl : null;
  });

  const formatLabel = computed(() => {
    const game = latestGame.value;

    if (!game) {
      return '';
    }

    const typeLabel = HOME_LATEST_GAME_TYPE_LABELS[game.type];

    return game.type === 'OFFLINE' && game.city
      ? `${typeLabel}, ${game.city}`
      : typeLabel;
  });

  const placeholderText = computed(() =>
    hasError.value ? HOME_LATEST_GAME_ERROR_TEXT : HOME_LATEST_GAME_EMPTY_TEXT,
  );

  /** Загружает первую страницу и выбирает игру по дате создания: поднятые
   * объявления стоят выше новых в каталоге. */
  const loadLatestGame = async (): Promise<void> => {
    try {
      const url = new URL(HOME_LATEST_GAME_API_URL, window.location.origin);

      url.searchParams.set('page', '0');
      url.searchParams.set('size', String(HOME_LATEST_GAME_LOOKUP_SIZE));

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Game catalog: ${response.status}`);
      }

      const games = parseHomeGames(await response.json());

      latestGame.value = games.reduce<HomeGame | null>(
        (latest, game) =>
          !latest || Date.parse(game.createdAt) > Date.parse(latest.createdAt)
            ? game
            : latest,
        null,
      );
    } catch {
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  onBeforeMount(loadLatestGame);
</script>

<template>
  <home-panel
    :label="HOME_LATEST_GAME_LABEL"
    :icon="HOME_LATEST_GAME_ICON"
    flush
    class="home-latest-game"
  >
    <div
      v-if="isLoading"
      class="home-latest-game__loading"
      aria-label="Загрузка игры"
    >
      <span class="home-latest-game__loading-cover" />

      <span class="home-latest-game__loading-line" />
    </div>

    <a
      v-else-if="latestGame"
      :href="gameUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="home-latest-game__card"
    >
      <span class="home-latest-game__cover">
        <img
          v-if="coverUrl"
          :src="coverUrl"
          :alt="latestGame.title"
          loading="lazy"
          class="home-latest-game__image"
        />

        <svg-icon
          v-else
          :icon="HOME_LATEST_GAME_ICON"
          :size="48"
          class="home-latest-game__cover-icon"
        />

        <span class="home-latest-game__format">{{ formatLabel }}</span>
      </span>

      <span class="home-latest-game__details">
        <span class="home-latest-game__title">{{ latestGame.title }}</span>

        <span class="home-latest-game__seats">
          Мест занято: {{ latestGame.takenSeats }}/{{ latestGame.maxPlayers }}
        </span>
      </span>
    </a>

    <p
      v-else
      class="home-latest-game__placeholder"
    >
      {{ placeholderText }}
    </p>

    <a
      :href="HOME_LATEST_GAME_CATALOG_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="home-latest-game__all"
    >
      {{ HOME_LATEST_GAME_ALL_LABEL }}
    </a>
  </home-panel>
</template>

<style lang="scss" scoped>
  .home-latest-game {
    &__card {
      display: flex;
      flex-direction: column;
      color: var(--text-color);
      text-decoration: none;

      &:hover .home-latest-game__title {
        color: var(--primary);
      }
    }

    &__cover,
    &__loading-cover {
      position: relative;

      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      aspect-ratio: 16 / 9;
      width: 100%;

      background-color: var(--bg-light-main);
    }

    &__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__cover-icon {
      color: var(--primary);
    }

    &__format {
      position: absolute;
      right: 8px;
      bottom: 8px;

      padding: 4px 8px;

      font-size: 12px;
      color: var(--text-color-title);

      background-color: var(--bg-secondary);
      border-radius: 6px;
    }

    &__details {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px;
    }

    &__title {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text-color-title);

      transition: color 0.2s ease;
    }

    &__seats {
      font-size: 13px;
      color: var(--text-g-color);
    }

    &__placeholder {
      margin: 12px;
      padding: 32px 12px;

      font-size: 14px;
      color: var(--text-g-color);
      text-align: center;

      border: 1px dashed var(--border);
      border-radius: 8px;
    }

    &__loading {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    &__loading-line {
      width: 70%;
      height: 18px;
      margin: 0 12px;

      background-color: var(--bg-light-main);
      border-radius: 6px;
    }

    &__all {
      display: block;

      padding: 0 12px 12px;

      font-size: 13px;
      font-weight: 600;
      color: var(--primary);
      text-decoration: none;
    }
  }
</style>
