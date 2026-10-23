<script setup lang="ts">
  import type { ScreenDetail } from '../model';

  import { ContentRender } from '~content/render';

  import { groupScreens } from '../model';
  import ScreenChildDrawer from './ScreenChildDrawer.vue';
  import ScreenLinkCard from './ScreenLinkCard.vue';

  /**
   * Корневой раздел ширмы: описание и вложенные разделы по группам.
   * Вложенный раздел открывается в дровере справа.
   */
  const { screen } = defineProps<{
    screen: ScreenDetail;
  }>();

  const groups = computed(() => groupScreens(screen.chields ?? []));

  const openPath = ref<string>();

  const isOpen = ref(false);

  /**
   * Открывает вложенный раздел в дровере.
   * @param path - адрес вложенного раздела
   */
  function open(path: string): void {
    openPath.value = path;
    isOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
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

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <ScreenLinkCard
          v-for="item in group.items"
          :key="item.url"
          :screen="item"
          @open="open"
        />
      </div>
    </section>

    <ScreenChildDrawer
      v-if="openPath"
      v-model:path="openPath"
      v-model:open="isOpen"
    />
  </div>
</template>
