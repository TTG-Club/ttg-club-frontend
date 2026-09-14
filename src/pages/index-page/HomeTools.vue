<script setup lang="ts">
  import { RouterLink } from 'vue-router';

  import { useNavStore } from '@/shared/stores/NavStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { getHomeTools, HOME_TOOLS_LABEL } from './model';

  import type { HomeNavLink } from './model';

  const { navItems } = storeToRefs(useNavStore());

  const tools = computed(() => getHomeTools(navItems.value));

  /**
   * Атрибуты ссылки чипа: переехавший на новый сайт инструмент открывается в
   * новой вкладке, здешний — роутером.
   * @param tool - инструмент ленты
   */
  function getLinkAttributes(tool: HomeNavLink) {
    return tool.external
      ? { href: tool.url, target: '_blank', rel: 'noopener noreferrer' }
      : { to: { path: tool.url } };
  }
</script>

<template>
  <!--
    Инструменты — лента чипов прямо под поиском: это второй по важности
    сценарий после поиска, и в шапке они попадаются на глаза первыми. На узком
    экране лента переносится по строкам, подписи не режем.
  -->
  <nav
    :aria-label="HOME_TOOLS_LABEL"
    class="home-tools"
  >
    <component
      :is="tool.external ? 'a' : RouterLink"
      v-for="tool in tools"
      :key="tool.url"
      v-bind="getLinkAttributes(tool)"
      class="home-tools__chip"
    >
      <svg-icon
        :icon="tool.icon"
        :size="18"
        class="home-tools__icon"
      />

      {{ tool.name }}
    </component>
  </nav>
</template>

<style lang="scss" scoped>
  .home-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;

    &__chip {
      display: flex;
      gap: 8px;
      align-items: center;

      padding: 8px 12px;

      font-size: 14px;
      font-weight: 500;
      line-height: 1;
      color: var(--text-color);
      text-decoration: none;

      background-color: var(--bg-secondary);
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

        .home-tools__icon {
          color: var(--primary);
        }
      }
    }

    &__icon {
      flex-shrink: 0;
      color: var(--text-g-color);
      transition: color 0.2s ease;
    }
  }
</style>
