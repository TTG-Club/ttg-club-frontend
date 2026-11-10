<script setup lang="ts">
  import { HOME_LINK_ARROW_ICON } from '../model';
  import HomeEyebrow from './HomeEyebrow.vue';

  const {
    label = undefined,
    icon = undefined,
    flush = false,
    fill = false,
    to = undefined,
    linkLabel = undefined,
  } = defineProps<{
    /** Моно-подпись в шапке панели; без неё шапка не рисуется */
    label?: string;
    /** Иконка рядом с подписью */
    icon?: string;
    /** Содержимое без внутренних отступов — для картинки во всю ширину */
    flush?: boolean;
    /** Тело тянется на высоту панели и раскладывает содержимое столбцом */
    fill?: boolean;
    /** Куда ведёт подвал панели — внешний адрес открывается в новой вкладке */
    to?: string;
    /** Подпись подвала; без неё или без адреса подвал не рисуется */
    linkLabel?: string;
  }>();

  const hasFooter = computed(() => Boolean(to && linkLabel));

  // min-h-0 — чтобы содержимое могло прокручиваться внутри, когда высоту
  // панели задаёт раскладка, а не содержимое
  const bodyClass = computed(() => [
    flush ? undefined : 'p-3',
    fill ? 'flex min-h-0 flex-auto flex-col' : undefined,
  ]);
</script>

<template>
  <section
    class="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-muted transition-colors duration-200 hover:border-secondary-hover"
  >
    <header
      v-if="label"
      class="flex shrink-0 items-center justify-between gap-2 border-b border-default px-3 py-2.5"
    >
      <HomeEyebrow
        :label="label"
        :icon="icon"
      />
    </header>

    <div :class="bodyClass">
      <slot />
    </div>

    <NuxtLink
      v-if="hasFooter"
      :to="to"
      external
      target="_blank"
      class="mt-auto flex shrink-0 items-center justify-between gap-2 border-t border-default px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase no-underline transition-colors hover:bg-elevated hover:text-primary"
    >
      {{ linkLabel }}

      <UIcon
        :name="HOME_LINK_ARROW_ICON"
        class="size-3.5"
      />
    </NuxtLink>
  </section>
</template>
