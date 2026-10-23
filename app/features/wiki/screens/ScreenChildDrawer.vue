<script setup lang="ts">
  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';
  import { provideSectionOpener } from '~section/composables';
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { screenDetailSchema, SCREENS_SECTION } from '../model';
  import ScreenBody from './ScreenBody.vue';

  /**
   * Вложенный раздел ширмы в дровере справа. Карточка та же, что у
   * корневого раздела: ссылка, закладка, страница, правка и закрытие.
   * Закрытие закрывает только этот дровер, а не корневой раздел под ним.
   */
  const path = defineModel<string>('path', { required: true });

  const isOpen = defineModel<boolean>('open', { default: false });

  const isInset = useMediaQuery(LAYOUT_DRAWER_QUERY);

  provideSectionOpener({
    activePath: computed(() => (isOpen.value ? path.value : undefined)),
    open: (next: string) => {
      path.value = next;
      isOpen.value = true;
    },
    close: () => {
      isOpen.value = false;
    },
  });
</script>

<template>
  <UDrawer
    v-model:open="isOpen"
    :title="SCREENS_SECTION.title"
    :inset="isInset"
    :handle="false"
    direction="right"
    :ui="{
      content: 'w-full max-w-2xl',
      header: 'sr-only',
      body: 'p-4 sm:p-6',
    }"
  >
    <template #body>
      <SectionEntry
        :key="path"
        :path="path"
        :section="SCREENS_SECTION"
        :schema="screenDetailSchema"
        :get-edit-path="getWorkshopEditPath"
      >
        <template #default="{ entry }">
          <ScreenBody :screen="entry" />
        </template>
      </SectionEntry>
    </template>
  </UDrawer>
</template>
