<script setup lang="ts">
  import {
    FOOTER_COPYRIGHT,
    FOOTER_DISCLAIMER,
    FOOTER_LEGAL_LINKS,
    FOOTER_SOCIAL_LINKS,
    FOOTER_SUPPORT_EMAIL,
    FOOTER_SUPPORT_EMAIL_HREF,
    FOOTER_SUPPORT_EMAIL_ICON,
    FOOTER_SUPPORT_LINKS,
  } from './model';

  /**
   * Подвал сайта, как на new.ttg.club: копирайт, ссылки на юридические
   * документы (они живут на новом сайте), соцсети и почта поддержки.
   */
  const { wide = false } = defineProps<{
    /**
     * Растянуть подвал на 2xl до `--max-content-wide` — вслед за колонкой
     * главной, иначе на широком мониторе он уже контента над ним.
     */
    wide?: boolean;
  }>();

  // sm:px-4 lg:px-4 не избыточны: перекрывают адаптивные отступы контейнера
  // (sm:px-6 lg:px-8), чтобы подвал совпадал по ширине с контентом сайта
  const containerClass = computed(() => [
    'mx-auto w-full px-4 sm:px-4 lg:px-4 max-w-(--max-content) py-4 lg:flex lg:items-center lg:justify-between lg:gap-x-3',
    wide ? '2xl:max-w-(--max-content-wide)' : undefined,
  ]);
</script>

<template>
  <UFooter
    :ui="{
      root: 'mt-auto border-t border-default',
      container: containerClass,
      left: 'flex items-center justify-center lg:justify-start lg:flex-1 gap-x-1.5 lg:order-1',
      center: 'mt-3 lg:mt-0 lg:order-2 flex items-center justify-center',
      right:
        'mt-3 lg:mt-0 lg:flex-1 flex items-center justify-center lg:justify-end gap-x-1.5 lg:order-3',
    }"
  >
    <template #left>
      <div class="flex flex-col gap-1 text-center lg:text-left">
        <span class="text-sm text-muted">
          {{ FOOTER_COPYRIGHT }}
        </span>

        <span class="text-xs text-dimmed xl:whitespace-nowrap">
          {{ FOOTER_DISCLAIMER }}
        </span>

        <div
          class="flex flex-wrap items-center justify-center gap-x-3 lg:justify-start"
        >
          <UButton
            v-for="link in FOOTER_LEGAL_LINKS"
            :key="link.url"
            :label="link.label"
            :to="link.url"
            :icon="link.icon"
            target="_blank"
            variant="link"
            color="neutral"
            size="xs"
            class="px-0"
          />
        </div>
      </div>
    </template>

    <template #right>
      <div class="flex flex-col items-center gap-2 lg:items-end">
        <div class="flex flex-wrap items-center gap-1">
          <UButton
            v-for="link in FOOTER_SOCIAL_LINKS"
            :key="link.url"
            :to="link.url"
            :icon="link.icon"
            :aria-label="link.label"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            square
          />

          <USeparator
            orientation="vertical"
            class="mx-1 h-5"
          />

          <UButton
            v-for="link in FOOTER_SUPPORT_LINKS"
            :key="link.url"
            :to="link.url"
            :icon="link.icon"
            :aria-label="link.label"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            square
          />
        </div>

        <UButton
          :label="FOOTER_SUPPORT_EMAIL"
          :href="FOOTER_SUPPORT_EMAIL_HREF"
          :icon="FOOTER_SUPPORT_EMAIL_ICON"
          variant="link"
          color="neutral"
          size="xs"
        />
      </div>
    </template>
  </UFooter>
</template>
