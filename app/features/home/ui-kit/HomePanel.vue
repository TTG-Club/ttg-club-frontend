<script setup lang="ts">
  import { HOME_LINK_ARROW_ICON } from '../model';
  import HomeEyebrow from './HomeEyebrow.vue';

  const {
    label = undefined,
    icon = undefined,
    flush = false,
    fill = false,
    detached = false,
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
    /**
     * С xl содержимое не участвует в высоте панели: её задаёт ряд, а
     * содержимое занимает ровно эту высоту и прокручивается внутри. Ниже xl
     * ряда нет, и панель живёт по содержимому
     */
    detached?: boolean;
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
    detached ? 'xl:relative xl:min-h-0 xl:flex-auto' : undefined,
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
      <!-- Обёртка вынута из потока: у неё нет своей высоты, поэтому длинная
        лента не раздувает ряд и не растягивает соседей -->
      <div
        v-if="detached"
        class="xl:absolute xl:inset-0 xl:overflow-hidden"
      >
        <slot />
      </div>

      <slot v-else />
    </div>

    <!-- Подвал — одна строка: ссылка «смотреть всё» и, если панель их
      дала, свои органы управления справа. Они лежат рядом со ссылкой, а не
      внутри неё: кнопка внутри ссылки — невалидная разметка. Без соседей
      стрелка ссылки уходит к правому краю, с соседями (`has-[+div]`) остаётся
      у подписи — иначе повисла бы посреди строки -->
    <footer
      v-if="hasFooter"
      class="@container mt-auto flex shrink-0 items-stretch border-t border-default"
    >
      <NuxtLink
        :to="to"
        external
        target="_blank"
        class="flex min-w-0 flex-auto items-center justify-between gap-2 px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase no-underline transition-colors hover:bg-elevated hover:text-primary has-[+div]:justify-start"
      >
        <span class="truncate">{{ linkLabel }}</span>

        <UIcon
          :name="HOME_LINK_ARROW_ICON"
          class="size-3.5 shrink-0"
        />
      </NuxtLink>

      <div
        v-if="$slots.aside"
        class="flex shrink-0 items-center gap-2 px-2"
      >
        <slot name="aside" />
      </div>
    </footer>
  </section>
</template>
