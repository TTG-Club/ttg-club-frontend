<script setup lang="ts">
  import {
    HOME_SOCIAL_ICON,
    HOME_SOCIAL_LABEL,
    HOME_SOCIAL_LINKS,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  // Цвет бренда задаёт рамку и иконку кнопки
  const socialLinks = HOME_SOCIAL_LINKS.map((link) => ({
    ...link,
    style: { '--home-social-color': link.color },
  }));
</script>

<template>
  <HomePanel
    :label="HOME_SOCIAL_LABEL"
    :icon="HOME_SOCIAL_ICON"
  >
    <!-- Панель даёт отступ 12px, кнопкам соцсетей хватает 8px -->
    <div class="-m-1 grid grid-cols-2 gap-2">
      <a
        v-for="link in socialLinks"
        :key="link.url"
        :href="link.url"
        :style="link.style"
        :class="$style.link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <UIcon
          :name="link.icon"
          :class="$style.icon"
        />

        {{ link.name }}
      </a>
    </div>
  </HomePanel>
</template>

<style lang="scss" module>
  .link {
    overflow: hidden;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;

    height: 44px;

    /* Рамка цвета бренда, но приглушённая; ярко она загорается под курсором */
    border: 1px solid
      color-mix(in srgb, var(--home-social-color) 55%, transparent);
    border-radius: 8px;

    font-size: 14px;
    font-weight: 600;
    color: var(--text-color-title);
    text-decoration: none;

    background-color: var(--bg-light-main);

    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      border-color: var(--home-social-color);
      color: var(--text-color-title);
      background-color: var(--bg-sub-menu);
    }
  }

  .icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: var(--home-social-color);
  }
</style>
