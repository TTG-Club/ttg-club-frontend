<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import type { RaceLink } from '../model';

  import {
    getRaceAbilitiesLabel,
    groupSubraces,
    RACE_ICON,
    RACE_TEXT,
  } from '../model';

  /**
   * Карточка расы в списке: картинка с градиентом, названия, бонусы
   * характеристик и книга. Кнопка в углу раскрывает разновидности.
   */
  const { race, to = undefined } = defineProps<{
    race: RaceLink;
    to?: RouteLocationRaw;
  }>();

  const route = useRoute();
  const isExpanded = ref(false);

  const abilities = computed(() => getRaceAbilitiesLabel(race.abilities, true));

  const subraceGroups = computed(() => groupSubraces(race.subraces));

  const toggleIcon = computed(() =>
    isExpanded.value ? RACE_ICON.collapse : RACE_ICON.expand,
  );

  const toggleLabel = computed(() =>
    isExpanded.value ? RACE_TEXT.hideSubraces : RACE_TEXT.showSubraces,
  );

  // Раса открыта или открыта её разновидность — подсвечиваем карточку
  const isActive = computed(
    () => route.path === race.url || route.path.startsWith(`${race.url}/`),
  );

  const cardClass = computed(() =>
    isActive.value ? 'border-accented' : 'border-default',
  );

  /**
   * Ссылка на разновидность с текущими поиском и фильтром.
   * @param url - адрес разновидности
   */
  function getSubraceLink(url: string): RouteLocationRaw {
    return { path: url, query: route.query };
  }

  /**
   * Подсветка открытой разновидности полосой слева.
   * @param url - адрес разновидности
   */
  function getSubraceClass(url: string) {
    return route.path === url
      ? 'border-link text-highlighted'
      : 'border-transparent';
  }

  function toggle() {
    isExpanded.value = !isExpanded.value;
  }
</script>

<template>
  <div
    :class="[$style.card, cardClass]"
    class="relative isolate overflow-hidden rounded-2xl border"
  >
    <img
      v-if="race.image"
      :src="race.image"
      :alt="race.name.rus"
      :class="$style.image"
      loading="lazy"
    />

    <div :class="$style.gradient" />

    <NuxtLink
      :to="to"
      class="relative z-10 flex h-32 flex-col justify-between p-4 sm:h-40"
    >
      <span class="flex flex-col pr-2">
        <span class="text-lg font-medium text-highlighted">
          {{ race.name.rus }}
        </span>

        <span class="text-sm text-muted">{{ race.name.eng }}</span>
      </span>

      <span class="flex flex-wrap gap-1">
        <UBadge
          v-if="abilities"
          :label="abilities"
          variant="solid"
          size="sm"
          class="rounded-full"
        />

        <UTooltip
          v-if="race.source"
          :text="race.source.name"
        >
          <UBadge
            :label="race.source.shortName"
            variant="solid"
            size="sm"
            class="rounded-full"
          />
        </UTooltip>
      </span>
    </NuxtLink>

    <UTooltip
      v-if="subraceGroups.length"
      :text="RACE_TEXT.subraces"
    >
      <UButton
        :icon="toggleIcon"
        :aria-label="toggleLabel"
        :aria-expanded="isExpanded"
        class="absolute right-0 bottom-0 z-20 rounded-none rounded-tl-xl"
        @click.left.exact.prevent="toggle"
      />
    </UTooltip>

    <div
      v-if="isExpanded"
      class="relative z-10 flex flex-col gap-4 px-4 pb-4"
    >
      <div
        v-for="group in subraceGroups"
        :key="group.name"
      >
        <p class="px-2 text-highlighted">
          {{ group.name }}
        </p>

        <ul class="ml-2 flex flex-col items-start border-l border-default pt-2">
          <li
            v-for="subrace in group.items"
            :key="subrace.url"
          >
            <NuxtLink
              :to="getSubraceLink(subrace.url)"
              :class="getSubraceClass(subrace.url)"
              class="-ml-px block border-l-2 px-2 py-1.5 hover:bg-elevated"
            >
              {{ subrace.name.rus }}

              <span class="text-xs text-muted">
                {{ subrace.source?.shortName }} / {{ subrace.name.eng }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  /* Фон и градиент карточки — переменные темы старого SPA */
  .card {
    background-color: var(--bg-table-list);
  }

  .image {
    pointer-events: none;

    position: absolute;
    top: 0;
    right: 0;

    width: 50%;

    @media (width >= 64rem) {
      width: 70%;
    }

    @media (width >= 96rem) {
      width: 80%;
    }
  }

  .gradient {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: var(--bg-liner-list);
  }
</style>
