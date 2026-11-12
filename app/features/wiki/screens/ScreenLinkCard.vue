<script setup lang="ts">
  import type { ScreenLink } from '../model';

  import { useSectionOpener } from '~section/composables';

  import ScreenIcon from './ScreenIcon.vue';

  /**
   * Вложенный раздел справочника плиткой: иконка, название, источник.
   * Клик открывает раздел так, как велит страница справочника (колонкой,
   * дровером или страницей); вне неё, а также по Ctrl-клику и средней
   * кнопкой — обычная ссылка на страницу раздела.
   */
  const { screen } = defineProps<{
    screen: ScreenLink;
  }>();

  const opener = useSectionOpener();

  const isActive = computed(() => opener?.activePath.value === screen.url);

  const cardClass = computed(() =>
    isActive.value
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-elevated/50 hover:bg-elevated',
  );

  /**
   * Открывает раздел через страницу справочника, если она умеет.
   * @param event - клик по плитке
   */
  function open(event: MouseEvent): void {
    if (!opener) {
      return;
    }

    event.preventDefault();
    opener.open(screen.url);
  }
</script>

<template>
  <NuxtLink
    :to="screen.url"
    :class="cardClass"
    class="flex h-full items-center gap-3 rounded-lg border p-4 transition-colors"
    @click.left.exact.capture="open"
  >
    <ScreenIcon :markup="screen.icon" />

    <span class="min-w-0">
      <span class="block font-semibold text-highlighted">
        {{ screen.name.rus }}
      </span>

      <span class="block text-sm">
        <UTooltip
          v-if="screen.source"
          :text="screen.source.name"
        >
          <span>{{ screen.source.shortName }}</span>
        </UTooltip>

        <span
          v-if="screen.source"
          class="mx-1"
          >/</span
        >

        <span>{{ screen.name.eng }}</span>
      </span>
    </span>
  </NuxtLink>
</template>
