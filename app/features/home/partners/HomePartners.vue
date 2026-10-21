<script setup lang="ts">
  import { sortBy } from 'es-toolkit';

  import {
    HOME_PARTNERS_DATA_KEY,
    HOME_PARTNERS_ICON,
    HOME_PARTNERS_LABEL,
    HOME_PARTNERS_PATH,
    parseHomePartners,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  // Блок необязательный: при ошибке запроса его просто нет
  const { data: partners } = useAsyncData(
    HOME_PARTNERS_DATA_KEY,
    async () => parseHomePartners(await $fetch(HOME_PARTNERS_PATH)),
    { default: () => [] },
  );

  const sortedPartners = computed(() => sortBy(partners.value, ['order']));
</script>

<template>
  <HomePanel
    v-if="sortedPartners.length"
    :label="HOME_PARTNERS_LABEL"
    :icon="HOME_PARTNERS_ICON"
    fill
  >
    <!-- С xl высоту панели задаёт колонка: друзей много, и список
      прокручивается внутри, а не вытягивает всю ленту -->
    <div
      class="flex flex-wrap content-start gap-2 xl:min-h-0 xl:flex-[1_1_0] xl:overflow-y-auto"
    >
      <UTooltip
        v-for="partner in sortedPartners"
        :key="partner.url"
        :text="partner.description"
        :disabled="!partner.description"
      >
        <a
          :href="partner.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 rounded-lg border border-default bg-overlay px-2.5 py-1.5 text-sm leading-5 text-default no-underline transition-colors duration-200 hover:border-secondary-hover hover:bg-elevated hover:text-highlighted"
        >
          <img
            :src="partner.img"
            :alt="partner.name"
            width="20"
            height="20"
            loading="lazy"
            class="size-5 shrink-0 overflow-hidden rounded-full border border-default"
          />

          {{ partner.name }}
        </a>
      </UTooltip>
    </div>
  </HomePanel>
</template>
