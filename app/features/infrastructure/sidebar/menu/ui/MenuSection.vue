<script setup lang="ts">
  import type { MenuItem } from '../model';

  import { MENU_EXTERNAL_ICON } from '../model';

  const { items } = defineProps<{
    label: string;
    items: Array<MenuItem>;
  }>();

  // Пункт на другой сайт открывается в новой вкладке и помечен стрелкой
  const links = computed(() =>
    items.map((link) => ({
      ...link,
      target: link.external ? '_blank' : undefined,
      trailingIcon: link.external ? MENU_EXTERNAL_ICON : undefined,
    })),
  );
</script>

<template>
  <section :class="$style.section">
    <h3
      class="mb-1 px-2.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase"
    >
      {{ label }}
    </h3>

    <ul class="flex flex-col gap-0.5">
      <li
        v-for="link in links"
        :key="link.href"
      >
        <UButton
          :to="link.href"
          :target="link.target"
          :icon="link.icon"
          :trailing-icon="link.trailingIcon"
          color="neutral"
          variant="ghost"
          active-variant="soft"
          active-color="primary"
          block
          :ui="{
            base: 'justify-start gap-2.5 px-2.5 py-2 text-left font-normal',
            leadingIcon: 'size-4.5 text-dimmed',
            trailingIcon: 'size-3.5 text-dimmed',
            label: 'whitespace-normal',
          }"
          :class="$style.item"
          :active-class="$style.active"
          :label="link.label"
        />
      </li>
    </ul>
  </section>
</template>

<style lang="scss" module>
  // Раздел не рвётся между колонками меню (см. .content в AppMenu)
  .section {
    break-inside: avoid;
    padding-bottom: 32px;
  }

  // Иконка пункта подхватывает цвет текста при наведении и на текущем разделе
  .item {
    &:hover,
    &.active {
      :global(.iconify) {
        color: currentcolor;
      }
    }
  }
</style>
