<script setup lang="ts">
  import { useHomeLatestGame } from '../composables';
  import {
    formatHomeGameSession,
    getHomeGameFormatSummary,
    getHomeGameGenresLabel,
    getHomeSiteImageUrl,
    HOME_LATEST_GAME_ALL_LABEL,
    HOME_LATEST_GAME_CATALOG_URL,
    HOME_LATEST_GAME_COST_LABELS,
    HOME_LATEST_GAME_EMPTY_TEXT,
    HOME_LATEST_GAME_ERROR_TEXT,
    HOME_LATEST_GAME_ICON,
    HOME_LATEST_GAME_LABEL,
    HOME_LATEST_GAME_LOADING_LABEL,
    HOME_LATEST_GAME_MASTER_LABEL,
    HOME_LATEST_GAME_NEXT_SESSION_EMPTY,
    HOME_LATEST_GAME_NEXT_SESSION_ICON,
    HOME_LATEST_GAME_NEXT_SESSION_LABEL,
    HOME_LATEST_GAME_SEATS_ICON,
    HOME_LATEST_GAME_SEATS_LABEL,
    HOME_LATEST_GAME_TYPE_ICONS,
    HOME_LATEST_GAME_UNKNOWN_MASTER,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  const { latestGame, isLoading, hasError } = useHomeLatestGame();

  const game = computed(() => latestGame.value?.game);

  const gameUrl = computed(() =>
    game.value
      ? `${HOME_LATEST_GAME_CATALOG_URL}/${game.value.id}`
      : HOME_LATEST_GAME_CATALOG_URL,
  );

  const coverUrl = computed(() => getHomeSiteImageUrl(game.value?.imageUrl));

  const formatIcon = computed(() =>
    game.value ? HOME_LATEST_GAME_TYPE_ICONS[game.value.type] : undefined,
  );

  const formatSummary = computed(() =>
    game.value ? getHomeGameFormatSummary(game.value) : '',
  );

  const genresLabel = computed(() =>
    game.value ? getHomeGameGenresLabel(game.value) : '',
  );

  const systemLabel = computed(
    () =>
      game.value?.customSystem
      || latestGame.value?.systemName
      || game.value?.system,
  );

  const costLabel = computed(() =>
    game.value ? HOME_LATEST_GAME_COST_LABELS[game.value.costType] : '',
  );

  /** Бесплатная игра — спокойным цветом, платная — предупреждающим */
  const costClass = computed(() =>
    game.value?.costType === 'PAID'
      ? 'text-legacy-warning'
      : 'text-legacy-success',
  );

  const nextSessionStartsAt = computed(() => game.value?.nextSession?.startsAt);

  /** Своей даты у игры нет — время назначается встречам, берём ближайшую */
  const nextSessionLabel = computed(() =>
    nextSessionStartsAt.value
      ? formatHomeGameSession(nextSessionStartsAt.value)
      : HOME_LATEST_GAME_NEXT_SESSION_EMPTY,
  );

  const nextSessionClass = computed(() =>
    nextSessionStartsAt.value ? 'font-medium text-default' : undefined,
  );

  const masterName = computed(
    () =>
      latestGame.value?.master?.displayName || HOME_LATEST_GAME_UNKNOWN_MASTER,
  );

  const masterAvatarUrl = computed(() =>
    getHomeSiteImageUrl(latestGame.value?.master?.avatarUrl),
  );

  const masterInitial = computed(() => masterName.value.charAt(0));

  const masterHint = computed(
    () => `${HOME_LATEST_GAME_MASTER_LABEL}: ${masterName.value}`,
  );

  const seatsLabel = computed(() =>
    game.value ? `${game.value.takenSeats} / ${game.value.maxPlayers}` : '',
  );

  const seatsHint = computed(
    () => `${HOME_LATEST_GAME_SEATS_LABEL}: ${seatsLabel.value}`,
  );

  const placeholderText = computed(() =>
    hasError.value ? HOME_LATEST_GAME_ERROR_TEXT : HOME_LATEST_GAME_EMPTY_TEXT,
  );
</script>

<template>
  <HomePanel
    :label="HOME_LATEST_GAME_LABEL"
    :icon="HOME_LATEST_GAME_ICON"
    flush
    fill
  >
    <!-- Скелетон повторяет карточку — обложку и две строки, — чтобы ряд не
      прыгал, когда игра приедет -->
    <div
      v-if="isLoading"
      :aria-label="HOME_LATEST_GAME_LOADING_LABEL"
      class="flex flex-auto flex-col"
    >
      <span :class="$style.cover" />

      <span class="flex flex-col gap-2 p-3">
        <USkeleton class="h-4.5 w-[70%]" />

        <USkeleton class="h-4.5 w-[45%]" />
      </span>
    </div>

    <a
      v-else-if="game"
      :href="gameUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex flex-auto flex-col text-default no-underline"
    >
      <span :class="$style.cover">
        <img
          v-if="coverUrl"
          :src="coverUrl"
          :alt="game.title"
          loading="lazy"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <UIcon
          v-else
          :name="HOME_LATEST_GAME_ICON"
          class="size-12 text-primary"
        />

        <span
          aria-hidden="true"
          :class="$style.overlay"
        />

        <span
          class="absolute top-2 right-2 rounded-md border border-current bg-muted px-2 text-xs leading-4.5 font-semibold"
          :class="costClass"
        >
          {{ costLabel }}
        </span>

        <!-- Формат, длительность и жанры — одна строка «какая это игра» -->
        <span
          class="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 pb-2.5 text-xs font-medium text-on-image"
        >
          <UIcon
            v-if="formatIcon"
            :name="formatIcon"
            class="size-4 shrink-0"
          />

          <span class="truncate">
            {{ formatSummary }}

            <template v-if="genresLabel">
              <span
                aria-hidden="true"
                class="opacity-50"
              >
                ·
              </span>

              {{ genresLabel }}
            </template>
          </span>
        </span>
      </span>

      <span class="flex flex-col gap-2 p-3">
        <span class="flex items-start justify-between gap-2">
          <span
            class="line-clamp-2 min-w-0 text-base leading-snug font-semibold text-highlighted transition-colors duration-200 group-hover:text-primary"
          >
            {{ game.title }}
          </span>

          <span
            class="mt-px shrink-0 rounded-md bg-primary/12 px-2 text-xs leading-4.5 font-semibold whitespace-nowrap text-primary"
          >
            {{ systemLabel }}
          </span>
        </span>

        <!-- Дата, мастер и места одной строкой значков; подписи — в
          подсказках и для скринридера -->
        <span class="flex items-center gap-3 text-[13px] text-muted">
          <span
            class="flex shrink-0 items-center gap-1.5"
            :title="HOME_LATEST_GAME_NEXT_SESSION_LABEL"
          >
            <UIcon
              :name="HOME_LATEST_GAME_NEXT_SESSION_ICON"
              class="size-4 shrink-0"
            />

            <span class="sr-only">
              {{ HOME_LATEST_GAME_NEXT_SESSION_LABEL }}:
            </span>

            <span :class="nextSessionClass">{{ nextSessionLabel }}</span>
          </span>

          <span
            class="flex min-w-0 shrink items-center gap-1.5"
            :title="masterHint"
          >
            <span class="sr-only">{{ HOME_LATEST_GAME_MASTER_LABEL }}:</span>

            <img
              v-if="masterAvatarUrl"
              :src="masterAvatarUrl"
              alt=""
              width="16"
              height="16"
              loading="lazy"
              class="size-4 shrink-0 rounded-full object-cover"
            />

            <span
              v-else
              aria-hidden="true"
              class="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/16 text-[10px] font-bold text-primary uppercase"
            >
              {{ masterInitial }}
            </span>

            <span class="truncate font-medium text-default">
              {{ masterName }}
            </span>
          </span>

          <span
            class="ml-auto flex shrink-0 items-center gap-1.5 tabular-nums"
            :title="seatsHint"
          >
            <UIcon
              :name="HOME_LATEST_GAME_SEATS_ICON"
              class="size-4 shrink-0"
            />

            <span class="sr-only">{{ HOME_LATEST_GAME_SEATS_LABEL }}:</span>

            {{ seatsLabel }}
          </span>
        </span>
      </span>
    </a>

    <p
      v-else
      class="m-3 rounded-lg border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ placeholderText }}
    </p>

    <a
      :href="HOME_LATEST_GAME_CATALOG_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="block px-3 pb-3 text-[13px] font-semibold text-primary no-underline"
    >
      {{ HOME_LATEST_GAME_ALL_LABEL }}
    </a>
  </HomePanel>
</template>

<style lang="scss" module>
  /* С xl соседи по ряду тянут панель вниз — разницу забирает обложка, а не
     пустота над ссылкой. Ниже xl обложка живёт по своим пропорциям */
  .cover {
    position: relative;

    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    aspect-ratio: 16 / 9;
    width: 100%;

    background-color: var(--bg-light-main);

    @media (width >= 1280px) {
      flex: 1 1 auto;
      aspect-ratio: auto;
      min-height: 128px;
    }
  }

  .overlay {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: var(--bg-image-overlay);
  }
</style>
