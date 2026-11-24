<script setup lang="ts">
  import type { SheetNote } from '../model';

  import { ContentRender } from '~content/render';

  import { useCharacterSheet, useRemoveConfirm } from '../composables';
  import { SheetConfirmModal, SheetNoteModal } from '../dialogs';
  import {
    createSheetElementId,
    NOTE_TEXT,
    SHEET_ICON,
    SHEET_ROW_ACTIONS_CLASS,
  } from '../model';

  /**
   * Заметки, как на new.ttg.club: карточки с названием и текстом в
   * разметке, сворачиваются по клику на шапку. Добавлять и править заметки
   * можно и на запертом листе — это игровые записи; удалять — только на
   * открытом.
   */
  const { document, update, ensureEditable, editControlClass } =
    useCharacterSheet();

  const {
    isOpen: isRemoveOpen,
    title: removeTitle,
    description: removeDescription,
    ask: askRemove,
    confirm: confirmRemove,
  } = useRemoveConfirm();

  const editedNote = ref<SheetNote | null>(null);
  const isEditOpen = ref(false);
  const collapsedIds = ref<Array<string>>([]);

  const notes = computed(() =>
    document.value.notes
      .filter((note) => note.title.trim() || note.text.length)
      .map((note) => {
        const isCollapsed = collapsedIds.value.includes(note.id);

        return {
          note,
          title: note.title.trim() || NOTE_TEXT.untitled,
          isCollapsed,
          chevronClass: isCollapsed ? '-rotate-90' : '',
        };
      }),
  );

  function openCreate(): void {
    editedNote.value = { id: createSheetElementId(), title: '', text: [] };
    isEditOpen.value = true;
  }

  /**
   * Правка заметки.
   * @param note - заметка
   */
  function openEdit(note: SheetNote): void {
    editedNote.value = note;
    isEditOpen.value = true;
  }

  /**
   * Сохраняет заметку: новая встаёт в начало, прежняя заменяется.
   * @param saved - заметка из окна
   */
  function saveNote(saved: SheetNote): void {
    update((current) => ({
      ...current,
      notes: current.notes.some((note) => note.id === saved.id)
        ? current.notes.map((note) => (note.id === saved.id ? saved : note))
        : [saved, ...current.notes],
    }));
  }

  /**
   * Сворачивает или разворачивает заметку.
   * @param id - идентификатор заметки
   */
  function toggleNote(id: string): void {
    collapsedIds.value = collapsedIds.value.includes(id)
      ? collapsedIds.value.filter((entry) => entry !== id)
      : [...collapsedIds.value, id];
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param note - заметка
   */
  function askRemoveNote(note: SheetNote): void {
    if (!ensureEditable()) {
      return;
    }

    askRemove(note.title.trim() || NOTE_TEXT.untitled, () =>
      update((current) => ({
        ...current,
        notes: current.notes.filter((entry) => entry.id !== note.id),
      })),
    );
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex justify-end">
      <UButton
        :label="NOTE_TEXT.add"
        :icon="SHEET_ICON.add"
        color="neutral"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="openCreate"
      />
    </div>

    <div
      v-for="entry in notes"
      :key="entry.note.id"
      class="group flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
    >
      <div class="relative flex items-center gap-2 p-3">
        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer items-center gap-2 text-left after:absolute after:inset-0"
          :aria-expanded="!entry.isCollapsed"
          @click.left.exact.prevent="toggleNote(entry.note.id)"
        >
          <UIcon
            name="tabler:chevron-down"
            class="size-4 shrink-0 text-muted transition-transform"
            :class="entry.chevronClass"
          />

          <span class="truncate text-sm font-semibold text-highlighted">
            {{ entry.title }}
          </span>
        </button>

        <div
          class="relative z-10 flex shrink-0 items-center gap-1"
          :class="SHEET_ROW_ACTIONS_CLASS"
        >
          <UButton
            :icon="SHEET_ICON.edit"
            :aria-label="`${NOTE_TEXT.edit}: ${entry.title}`"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="openEdit(entry.note)"
          />

          <UButton
            :icon="SHEET_ICON.remove"
            :aria-label="`${NOTE_TEXT.remove}: ${entry.title}`"
            color="error"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="askRemoveNote(entry.note)"
          />
        </div>
      </div>

      <div
        v-if="!entry.isCollapsed && entry.note.text.length"
        class="border-t border-default/50 px-3 py-2 text-sm"
      >
        <ContentRender :content="entry.note.text" />
      </div>
    </div>

    <div
      v-if="!notes.length"
      class="flex h-40 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ NOTE_TEXT.empty }}
    </div>

    <SheetNoteModal
      v-model:open="isEditOpen"
      :note="editedNote"
      @save="saveNote"
    />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="removeTitle"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </div>
</template>
