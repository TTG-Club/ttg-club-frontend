<script setup lang="ts">
  import type { ScreenDetail, ScreenLink } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionEntryDrawer } from '~section/entry-drawer';

  import { groupScreens, screenDetailSchema } from '../model';
  import ScreenBody from './ScreenBody.vue';
  import ScreenLinkCard from './ScreenLinkCard.vue';

  /**
   * Корневой раздел ширмы: описание и вложенные разделы по группам.
   * Вложенный раздел открывается в дровере справа.
   */
  const { screen } = defineProps<{
    screen: ScreenDetail;
  }>();

  const groups = computed(() => groupScreens(screen.chields ?? []));

  const selected = shallowRef<ScreenLink>();

  const isOpen = ref(false);

  /**
   * Открывает вложенный раздел в дровере.
   * @param item - вложенный раздел
   */
  function open(item: ScreenLink): void {
    selected.value = item;
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
          @open="open(item)"
        />
      </div>
    </section>

    <SectionEntryDrawer
      v-if="selected"
      :key="selected.url"
      v-model:open="isOpen"
      :schema="screenDetailSchema"
      :path="selected.url"
      :title="selected.name.rus"
    >
      <template #default="{ entry }">
        <ScreenBody :screen="entry" />
      </template>
    </SectionEntryDrawer>
  </div>
</template>
