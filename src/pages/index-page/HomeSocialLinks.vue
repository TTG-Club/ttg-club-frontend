<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import HomePanel from './HomePanel.vue';
  import {
    HOME_SOCIAL_ICON,
    HOME_SOCIAL_LABEL,
    HOME_SOCIAL_LINKS,
  } from './model';

  // Модификатор бренда задаёт цвет рамки и иконки кнопки
  const socialLinks = HOME_SOCIAL_LINKS.map((link) => ({
    ...link,
    classes: ['home-social__link', `home-social__link_${link.brand}`],
  }));
</script>

<template>
  <home-panel
    :label="HOME_SOCIAL_LABEL"
    :icon="HOME_SOCIAL_ICON"
  >
    <div class="home-social">
      <a
        v-for="link in socialLinks"
        :key="link.brand"
        :href="link.url"
        :class="link.classes"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg-icon
          :icon="link.icon"
          :size="20"
          class="home-social__icon"
        />

        {{ link.name }}
      </a>
    </div>
  </home-panel>
</template>

<style lang="scss" scoped>
  .home-social {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;

    // Панель даёт отступ 12px, кнопкам соцсетей хватает 8px
    margin: -4px;

    &__link {
      overflow: hidden;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;

      height: 44px;

      font-size: 14px;
      font-weight: 600;
      color: var(--text-color-title);
      text-decoration: none;

      background-color: var(--bg-light-main);
      border: 1px solid var(--home-social-color);
      border-radius: 8px;

      transition:
        background-color 0.2s ease,
        border-color 0.2s ease;

      // Рамка цвета бренда, но приглушённая; ярко она загорается под курсором.
      // Без color-mix рамка просто остаётся яркой: запасной вариант через два
      // объявления подряд не сработал бы — значение с var() браузер отбрасывает
      // уже после выбора, и рамка пропала бы совсем.
      @supports (color: color-mix(in srgb, currentColor 50%, transparent)) {
        border-color: color-mix(
          in srgb,
          var(--home-social-color) 55%,
          transparent
        );
      }

      // Цвет текста повторён явно: иначе его перебил бы глобальный `a:hover`
      &:hover {
        color: var(--text-color-title);
        background-color: var(--bg-sub-menu);
        border-color: var(--home-social-color);
      }

      &_telegram {
        --home-social-color: var(--telegram-base);
      }

      &_discord {
        --home-social-color: var(--discord-base);
      }

      &_vk {
        --home-social-color: var(--vk-base);
      }

      &_boosty {
        --home-social-color: var(--boosty-base);
      }
    }

    &__icon {
      flex-shrink: 0;
      color: var(--home-social-color);
    }
  }
</style>
