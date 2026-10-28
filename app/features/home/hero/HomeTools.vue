<script setup lang="ts">
  import type { HomeNavLink } from '../model';

  import { useHomeLink, useHomeMenu } from '../composables';
  import { HOME_TOOLS_LABEL } from './model';

  const { tools } = useHomeMenu();
  const { isExternalLink } = useHomeLink();

  /**
   * Переехавший на новый сайт инструмент открывается в новой вкладке.
   *
   * @param tool - инструмент ленты
   * @returns атрибут `target` ссылки
   */
  function getTarget(tool: HomeNavLink): string | undefined {
    return tool.external ? '_blank' : undefined;
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
    class="flex flex-wrap items-center justify-center gap-2"
  >
    <NuxtLink
      v-for="tool in tools"
      :key="tool.url"
      :to="tool.url"
      :external="isExternalLink(tool.url, tool.external)"
      :target="getTarget(tool)"
      class="group flex items-center gap-2 rounded-lg border border-default bg-muted px-3 py-2 text-sm leading-none font-medium text-default no-underline transition-colors duration-200 hover:border-secondary-hover hover:bg-elevated hover:text-highlighted"
    >
      <UIcon
        :name="tool.icon"
        class="size-4.5 shrink-0 text-muted transition-colors duration-200 group-hover:text-primary"
      />

      {{ tool.name }}
    </NuxtLink>
  </nav>
</template>
