<script setup lang="ts">
  import { orderBy } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import type { TPartner } from '@/shared/stores/NavStore';

  import HomePanel from './HomePanel.vue';
  import {
    HOME_PARTNERS_API_URL,
    HOME_PARTNERS_ICON,
    HOME_PARTNERS_LABEL,
    parseHomePartners,
  } from './model';

  const partners = ref<Array<TPartner>>([]);

  const showedPartners = computed(() =>
    orderBy(partners.value, ['order'], ['asc']),
  );

  /**
   * Загружает партнёров для блока «Наши друзья» и проверяет ответ API. Блок
   * необязательный: при ошибке запроса он просто не показывается.
   */
  const loadPartners = async (): Promise<void> => {
    try {
      const response = await httpClient.get<unknown>({
        url: HOME_PARTNERS_API_URL,
      });

      partners.value = parseHomePartners(response.data);
    } catch {
      partners.value = [];
    }
  };

  onBeforeMount(loadPartners);
</script>

<template>
  <home-panel
    v-if="showedPartners.length"
    :label="HOME_PARTNERS_LABEL"
    :icon="HOME_PARTNERS_ICON"
  >
    <div class="home-partners">
      <a
        v-for="partner in showedPartners"
        :key="partner.url"
        v-tippy="{ content: partner.description }"
        :href="partner.url"
        class="home-partners__chip"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          :alt="partner.name"
          :src="partner.img"
          class="home-partners__logo"
          height="20"
          width="20"
          loading="lazy"
        />

        {{ partner.name }}
      </a>
    </div>
  </home-panel>
</template>

<style lang="scss" scoped>
  .home-partners {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    &__chip {
      display: inline-flex;
      gap: 6px;
      align-items: center;

      padding: 6px 10px;

      font-size: 14px;
      line-height: 20px;
      color: var(--text-color);
      text-decoration: none;

      background-color: var(--bg-light-main);
      border: 1px solid var(--border);
      border-radius: 8px;

      transition:
        color 0.2s ease,
        background-color 0.2s ease,
        border-color 0.2s ease;

      &:hover {
        color: var(--text-color-title);
        background-color: var(--bg-sub-menu);
        border-color: var(--secondary-hover);
      }
    }

    &__logo {
      overflow: hidden;
      flex-shrink: 0;

      width: 20px;
      height: 20px;

      border: 1px solid var(--border);
      border-radius: 50%;
    }
  }
</style>
