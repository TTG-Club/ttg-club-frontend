<script setup lang="ts">
  import type { DmScreenWindow } from '../model';

  import { ContentRender } from '~content/render';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_NOTE_EDITOR_ROWS,
    DM_SCREEN_NOTE_MAX_LENGTH,
    DM_SCREEN_NOTE_SAVE_DELAY,
    DM_SCREEN_TEXT,
    getDmScreenNoteToggle,
  } from '../model';

  // Редактор мастерской тяжёлый, а нужен только при правке заметки
  const WorkshopHtmlEditor = defineAsyncComponent(() =>
    import('~workshop/html-editor').then((module) => module.WorkshopHtmlEditor),
  );

  /** Длина названия окна: как у заголовков окон на сервере. */
  const TITLE_MAX_LENGTH = 256;

  /**
   * Заметка мастера в окне ширмы: размеченный текст, который мастер пишет
   * сам. В просмотре ссылки на записи сайта открываются окнами, как в
   * любом окне ширмы; в правке — название и редактор мастерской. Новая
   * пустая заметка сразу открывается в правке. Текст сохраняется сам.
   * Правку переключает шапка окна (`v-model:editing`); в списке на
   * телефоне шапки нет, там кнопка внутри заметки.
   */
  const { screenWindow, isToggleShown = false } = defineProps<{
    screenWindow: DmScreenWindow;
    /** Показать кнопку правки внутри заметки: шапки окна рядом нет. */
    isToggleShown?: boolean;
  }>();

  const isEditing = defineModel<boolean>('editing', { default: false });

  const { update } = useDmScreen();

  const title = ref(screenWindow.title);
  const content = ref(screenWindow.content ?? '');

  // Пустую заметку читать незачем: она сразу открывается в правке
  if (!screenWindow.content) {
    isEditing.value = true;
  }

  const isTooLong = computed(
    () => content.value.length > DM_SCREEN_NOTE_MAX_LENGTH,
  );

  const isEmpty = computed(() => !content.value.trim());

  const toggleButton = computed(() => getDmScreenNoteToggle(isEditing.value));

  /** Пишет название и текст в окно; слишком длинный текст не пишется. */
  function save(): void {
    if (isTooLong.value) {
      return;
    }

    update(screenWindow.id, {
      title: title.value.trim() || DM_SCREEN_TEXT.noteTitle,
      content: content.value,
    });
  }

  const saveLater = useDebounceFn(save, DM_SCREEN_NOTE_SAVE_DELAY);

  watch([title, content], () => {
    void saveLater();
  });

  // Окно закрывают или уводят в плашку посреди набора: не потерять текст
  onBeforeUnmount(save);

  // Выход из правки сохраняет сразу, а слишком длинный текст из правки не
  // выпускает. Цикла нет: возврат в правку на втором проходе ничего не делает
  watch(isEditing, (editing) => {
    if (editing) {
      return;
    }

    if (isTooLong.value) {
      isEditing.value = true;

      return;
    }

    save();
  });

  const isHeadShown = computed(() => isEditing.value || isToggleShown);

  /** Переключает просмотр и правку. */
  function toggle(): void {
    isEditing.value = !isEditing.value;
  }
</script>

<template>
  <div class="flex flex-col gap-3 pt-3">
    <div
      v-if="isHeadShown"
      class="flex items-center gap-2"
    >
      <UInput
        v-if="isEditing"
        v-model="title"
        :placeholder="DM_SCREEN_TEXT.noteTitlePlaceholder"
        :maxlength="TITLE_MAX_LENGTH"
        class="min-w-0 flex-auto"
      />

      <UButton
        v-if="isToggleShown"
        :icon="toggleButton.icon"
        :label="toggleButton.label"
        :disabled="isEditing && isTooLong"
        color="neutral"
        variant="soft"
        size="sm"
        class="ml-auto"
        @click.left.exact.prevent="toggle"
      />
    </div>

    <p
      v-if="isTooLong"
      class="text-sm text-error"
    >
      {{ DM_SCREEN_TEXT.noteTooLong }}
    </p>

    <WorkshopHtmlEditor
      v-if="isEditing"
      v-model="content"
      :rows="DM_SCREEN_NOTE_EDITOR_ROWS"
    />

    <p
      v-else-if="isEmpty"
      class="text-sm text-muted"
    >
      {{ DM_SCREEN_TEXT.noteEmpty }}
    </p>

    <ContentRender
      v-else
      :html="content"
    />
  </div>
</template>
