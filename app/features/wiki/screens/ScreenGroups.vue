<script setup lang="ts">
  import type { ScreenDetail } from '../model';

  import { ContentRender } from '~content/render';

  import { groupScreens } from '../model';
  import ScreenLinkCard from './ScreenLinkCard.vue';

  /**
   * Корневой раздел справочника: описание и вложенные разделы по группам
   * ссылками на их страницы.
   */
  const { screen } = defineProps<{
    screen: ScreenDetail;
  }>();

  const groups = computed(() => groupScreens(screen.chields ?? []));
</script>

<template>
  <!-- Колонки считаются по ширине записи: она бывает узкой колонкой -->
  <div class="@container flex flex-col gap-4">
    <ContentRender
      v-if="screen.description"
      :html="screen.description"
    />

    <section
      v-for="group in groups"
      :key="group.key"
      class="flex flex-col gap-2"
    >
      <h3
        v-if="group.name"
        class="rounded-lg bg-elevated px-4 py-2 text-xl font-light text-highlighted"
      >
        {{ group.name }}
      </h3>

      <div class="grid grid-cols-1 gap-2 @sm:grid-cols-2 @3xl:grid-cols-3">
        <ScreenLinkCard
          v-for="item in group.items"
          :key="item.url"
          :screen="item"
        />
      </div>
    </section>
  </div>
</template>
