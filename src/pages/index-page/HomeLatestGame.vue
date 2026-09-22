<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { getDateString } from '@/shared/utils/getDateString';

  import HomePanel from './HomePanel.vue';
  import {
    getHomeGameFormatSummary,
    getHomeGameGenresLabel,
    getHomeGameSystemLabel,
    getHomeSiteImageUrl,
    HOME_LATEST_GAME_ALL_LABEL,
    HOME_LATEST_GAME_API_URL,
    HOME_LATEST_GAME_CATALOG_URL,
    HOME_LATEST_GAME_COST_LABELS,
    HOME_LATEST_GAME_EMPTY_TEXT,
    HOME_LATEST_GAME_ERROR_TEXT,
    HOME_LATEST_GAME_ICON,
    HOME_LATEST_GAME_LABEL,
    HOME_LATEST_GAME_LOOKUP_SIZE,
    HOME_LATEST_GAME_MASTER_LABEL,
    HOME_LATEST_GAME_NAMES_API_URL,
    HOME_LATEST_GAME_NEXT_SESSION_EMPTY,
    HOME_LATEST_GAME_NEXT_SESSION_FORMAT,
    HOME_LATEST_GAME_NEXT_SESSION_LABEL,
    HOME_LATEST_GAME_SEATS_LABEL,
    HOME_LATEST_GAME_TYPE_ICONS,
    HOME_LATEST_GAME_UNKNOWN_MASTER,
    parseHomeDisplayNames,
    parseHomeGames,
  } from './model';

  import type { HomeDisplayName, HomeGame } from './model';

  const latestGame = ref<HomeGame | null>(null);
  const isLoading = ref(true);
  const hasError = ref(false);

  const master = ref<HomeDisplayName | null>(null);
  const isMasterLoading = ref(true);

  const gameUrl = computed(() =>
    latestGame.value
      ? `${HOME_LATEST_GAME_CATALOG_URL}/${latestGame.value.id}`
      : HOME_LATEST_GAME_CATALOG_URL,
  );

  const coverUrl = computed(() =>
    getHomeSiteImageUrl(latestGame.value?.imageUrl),
  );

  const formatIcon = computed(() =>
    latestGame.value ? HOME_LATEST_GAME_TYPE_ICONS[latestGame.value.type] : '',
  );

  const formatSummary = computed(() =>
    latestGame.value ? getHomeGameFormatSummary(latestGame.value) : '',
  );

  const genresLabel = computed(() =>
    latestGame.value ? getHomeGameGenresLabel(latestGame.value) : '',
  );

  const systemLabel = computed(() =>
    latestGame.value ? getHomeGameSystemLabel(latestGame.value) : '',
  );

  const costLabel = computed(() =>
    latestGame.value
      ? HOME_LATEST_GAME_COST_LABELS[latestGame.value.costType]
      : '',
  );

  /** Бесплатная игра — спокойным цветом, платная — предупреждающим */
  const costClass = computed(() =>
    latestGame.value?.costType === 'PAID'
      ? 'home-latest-game__cost_paid'
      : 'home-latest-game__cost_free',
  );

  const nextSessionStartsAt = computed(
    () => latestGame.value?.nextSession?.startsAt ?? null,
  );

  /** Своей даты у игры нет — время назначается встречам, берём ближайшую */
  const nextSessionLabel = computed(() =>
    nextSessionStartsAt.value
      ? getDateString(
          nextSessionStartsAt.value,
          HOME_LATEST_GAME_NEXT_SESSION_FORMAT,
        )
      : HOME_LATEST_GAME_NEXT_SESSION_EMPTY,
  );

  const nextSessionClass = computed(() => ({
    'home-latest-game__date_empty': !nextSessionStartsAt.value,
  }));

  const masterName = computed(
    () => master.value?.displayName || HOME_LATEST_GAME_UNKNOWN_MASTER,
  );

  const masterAvatarUrl = computed(() =>
    getHomeSiteImageUrl(master.value?.avatarUrl),
  );

  const masterInitial = computed(() => masterName.value.charAt(0));

  const masterHint = computed(
    () => `${HOME_LATEST_GAME_MASTER_LABEL}: ${masterName.value}`,
  );

  const seatsLabel = computed(() =>
    latestGame.value
      ? `${latestGame.value.takenSeats} / ${latestGame.value.maxPlayers}`
      : '',
  );

  const seatsHint = computed(
    () => `${HOME_LATEST_GAME_SEATS_LABEL}: ${seatsLabel.value}`,
  );

  const placeholderText = computed(() =>
    hasError.value ? HOME_LATEST_GAME_ERROR_TEXT : HOME_LATEST_GAME_EMPTY_TEXT,
  );

  /**
   * Имя мастера: сервис игр знает только идентификатор, имя — в core-api.
   * Без имени карточка всё равно рабочая, поэтому ошибка только в консоль.
   * @param masterId - идентификатор мастера
   */
  const loadMaster = async (masterId: string): Promise<void> => {
    try {
      const response = await fetch(HOME_LATEST_GAME_NAMES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [masterId] }),
      });

      if (!response.ok) {
        throw new Error(`Display names: ${response.status}`);
      }

      const names = parseHomeDisplayNames(await response.json());

      master.value = names.find((name) => name.userId === masterId) ?? null;
    } catch (error) {
      console.warn('[home] Имя мастера не загрузилось:', error);
    } finally {
      isMasterLoading.value = false;
    }
  };

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

    if (latestGame.value) {
      await loadMaster(latestGame.value.masterId);
    }
  };

  onBeforeMount(loadLatestGame);
</script>

<template>
  <home-panel
    :label="HOME_LATEST_GAME_LABEL"
    :icon="HOME_LATEST_GAME_ICON"
    flush
    fill
    class="home-latest-game"
  >
    <!-- Скелетон повторяет карточку — обложку и две строки, — чтобы ряд не
      прыгал, когда игра приедет -->
    <div
      v-if="isLoading"
      class="home-latest-game__loading"
      aria-label="Загрузка игры"
    >
      <span class="home-latest-game__cover" />

      <span class="home-latest-game__details">
        <span class="home-latest-game__loading-line" />

        <span
          class="home-latest-game__loading-line home-latest-game__loading-line_short"
        />
      </span>
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

        <span
          aria-hidden="true"
          class="home-latest-game__overlay"
        />

        <span :class="['home-latest-game__cost', costClass]">
          {{ costLabel }}
        </span>

        <!-- Формат, длительность и жанры — одна строка «какая это игра» -->
        <span class="home-latest-game__format">
          <svg-icon
            :icon="formatIcon"
            :size="16"
            class="home-latest-game__format-icon"
          />

          <span class="home-latest-game__format-text">
            {{ formatSummary }}

            <template v-if="genresLabel">
              <span
                aria-hidden="true"
                class="home-latest-game__format-separator"
              >
                ·
              </span>

              {{ genresLabel }}
            </template>
          </span>
        </span>
      </span>

      <span class="home-latest-game__details">
        <span class="home-latest-game__heading">
          <span class="home-latest-game__title">{{ latestGame.title }}</span>

          <span class="home-latest-game__system">{{ systemLabel }}</span>
        </span>

        <!-- Дата, мастер и места одной строкой значков; подписи — в
          подсказках и для скринридера -->
        <span class="home-latest-game__meta">
          <span
            class="home-latest-game__meta-item"
            :title="HOME_LATEST_GAME_NEXT_SESSION_LABEL"
          >
            <svg-icon
              icon="home/calendar-event"
              :size="16"
              class="home-latest-game__meta-icon"
            />

            <span class="home-latest-game__sr-only">
              {{ HOME_LATEST_GAME_NEXT_SESSION_LABEL }}:
            </span>

            <span
              class="home-latest-game__date"
              :class="nextSessionClass"
            >
              {{ nextSessionLabel }}
            </span>
          </span>

          <span
            class="home-latest-game__meta-item home-latest-game__master"
            :title="masterHint"
          >
            <span class="home-latest-game__sr-only">
              {{ HOME_LATEST_GAME_MASTER_LABEL }}:
            </span>

            <span
              v-if="isMasterLoading"
              class="home-latest-game__master-loading"
            />

            <template v-else>
              <img
                v-if="masterAvatarUrl"
                :src="masterAvatarUrl"
                alt=""
                class="home-latest-game__avatar"
                height="16"
                width="16"
                loading="lazy"
              />

              <span
                v-else
                aria-hidden="true"
                class="home-latest-game__avatar"
              >
                {{ masterInitial }}
              </span>

              <span class="home-latest-game__master-name">
                {{ masterName }}
              </span>
            </template>
          </span>

          <span
            class="home-latest-game__meta-item home-latest-game__seats"
            :title="seatsHint"
          >
            <svg-icon
              icon="home/user"
              :size="16"
              class="home-latest-game__meta-icon"
            />

            <span class="home-latest-game__sr-only">
              {{ HOME_LATEST_GAME_SEATS_LABEL }}:
            </span>

            {{ seatsLabel }}
          </span>
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
    &__card,
    &__loading {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
    }

    &__card {
      color: var(--text-color);
      text-decoration: none;

      &:hover {
        .home-latest-game__title {
          color: var(--primary);
        }

        .home-latest-game__image {
          transform: scale(1.05);
        }
      }
    }

    // С xl соседи по ряду тянут панель вниз — разницу забирает обложка, а не
    // пустота над ссылкой. Ниже xl обложка живёт по своим пропорциям
    &__cover {
      position: relative;

      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      aspect-ratio: 16 / 9;
      width: 100%;

      background-color: var(--bg-light-main);

      @include media-min($xl) {
        flex: 1 1 auto;
        aspect-ratio: auto;
        min-height: 128px;
      }
    }

    &__image {
      position: absolute;
      inset: 0;

      width: 100%;
      height: 100%;

      object-fit: cover;

      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &__cover-icon {
      color: var(--primary);
    }

    &__overlay {
      pointer-events: none;
      position: absolute;
      inset: 0;
      background: var(--bg-image-overlay);
    }

    &__cost {
      position: absolute;
      top: 8px;
      right: 8px;

      padding: 2px 8px;

      font-size: 12px;
      font-weight: 600;
      line-height: 18px;

      background-color: var(--bg-secondary);
      border: 1px solid currentColor;
      border-radius: 6px;

      &_free {
        color: var(--success);
      }

      &_paid {
        color: var(--warning);
      }
    }

    &__format {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;

      display: flex;
      gap: 6px;
      align-items: center;

      padding: 0 12px 10px;

      font-size: 12px;
      font-weight: 500;
      color: var(--text-btn-color);
    }

    &__format-icon {
      flex-shrink: 0;
    }

    &__format-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__format-separator {
      opacity: 0.5;
    }

    &__details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
    }

    &__heading {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      justify-content: space-between;
    }

    &__title {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;

      min-width: 0;

      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text-color-title);

      transition: color 0.2s ease;
    }

    &__system {
      flex-shrink: 0;

      margin-top: 1px;
      padding: 2px 8px;

      font-size: 12px;
      font-weight: 600;
      line-height: 18px;
      color: var(--primary);
      white-space: nowrap;

      background-color: color-mix(in srgb, var(--primary) 12%, transparent);
      border-radius: 6px;
    }

    &__meta {
      display: flex;
      gap: 12px;
      align-items: center;

      font-size: 13px;
      color: var(--text-g-color);
    }

    &__meta-item {
      display: flex;
      flex-shrink: 0;
      gap: 6px;
      align-items: center;
    }

    &__meta-icon {
      flex-shrink: 0;
    }

    &__date {
      font-weight: 500;
      color: var(--text-color);

      &_empty {
        color: var(--text-g-color);
      }
    }

    &__master {
      flex-shrink: 1;
      min-width: 0;
    }

    &__avatar {
      overflow: hidden;
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      width: 16px;
      height: 16px;

      font-size: 10px;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;

      object-fit: cover;
      background-color: color-mix(in srgb, var(--primary) 16%, transparent);
      border-radius: 50%;
    }

    &__master-name {
      overflow: hidden;

      font-weight: 500;
      color: var(--text-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__master-loading {
      width: 80px;
      height: 14px;
      background-color: var(--bg-light-main);
      border-radius: 4px;
    }

    &__seats {
      margin-left: auto;
      font-variant-numeric: tabular-nums;
    }

    &__sr-only {
      position: absolute;

      overflow: hidden;

      width: 1px;
      height: 1px;

      white-space: nowrap;

      clip-path: inset(50%);
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

    &__loading-line {
      width: 70%;
      height: 18px;
      background-color: var(--bg-light-main);
      border-radius: 6px;

      &_short {
        width: 45%;
      }
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
