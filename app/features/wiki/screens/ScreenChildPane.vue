<script setup lang="ts">
  import { provideSectionOpener } from '~section/composables';
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import {
    SCREEN_BACK_ICON,
    SCREEN_TEXT,
    screenDetailSchema,
    SCREENS_SECTION,
  } from '../model';
  import ScreenBody from './ScreenBody.vue';

  /**
   * Вложенный раздел ширмы на месте корневого: в той же колонке, без
   * дровера и затемнения. Сверху кнопка возврата к корневому разделу;
   * закрытие карточки тоже возвращает к нему, а не закрывает колонку.
   */
  const { parentTitle } = defineProps<{
    /** Название корневого раздела на кнопке возврата. */
    parentTitle: string;
  }>();

  const path = defineModel<string>('path', { required: true });

  const emit = defineEmits<{
    back: [];
  }>();

  const root = useTemplateRef<HTMLElement>('root');

  provideSectionOpener({
    activePath: computed(() => path.value),
    open: (next: string) => {
      path.value = next;
    },
    close: back,
  });

  // Раздел открывается вверху колонки, а не там, где была карточка
  watch(
    path,
    () => {
      root.value?.scrollIntoView({ block: 'start' });
    },
    { flush: 'post' },
  );

  onMounted(() => {
    root.value?.scrollIntoView({ block: 'start' });
  });

  function back(): void {
    emit('back');
  }
</script>

<template>
  <div
    ref="root"
    class="flex scroll-mt-4 flex-col"
  >
    <UButton
      :icon="SCREEN_BACK_ICON"
      :label="parentTitle"
      :aria-label="SCREEN_TEXT.back"
      color="neutral"
      variant="ghost"
      size="sm"
      class="-mx-2.5 self-start print:hidden"
      @click.left.exact.prevent="back"
    />

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
  </div>
</template>
