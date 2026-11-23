<script setup lang="ts">
  import type { SheetNote } from '../model';

  import { useCharacterSheet, useRemoveConfirm } from '../composables';
  import { SheetConfirmModal } from '../dialogs';
  import { createSheetElementId, SHEET_ICON, SHEET_LABELS } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Заметки игрока отдельными записями: название и текст. */
  const { document, update } = useCharacterSheet();

  const {
    isOpen: isRemoveOpen,
    title: removeTitle,
    description: removeDescription,
    ask: askRemove,
    confirm: confirmRemove,
  } = useRemoveConfirm();

  /**
   * Меняет заметку.
   * @param id - идентификатор заметки
   * @param patch - изменённые поля
   */
  function patchNote(id: string, patch: Partial<SheetNote>): void {
    update((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === id ? { ...note, ...patch } : note,
      ),
    }));
  }

  function addNote(): void {
    update((current) => ({
      ...current,
      notes: [
        { id: createSheetElementId(), title: SHEET_LABELS.newNote, text: '' },
        ...current.notes,
      ],
    }));
  }

  /**
   * Убирает заметку.
   * @param id - идентификатор заметки
   */
  function removeNote(id: string): void {
    update((current) => ({
      ...current,
      notes: current.notes.filter((note) => note.id !== id),
    }));
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param note - заметка
   */
  function askRemoveNote(note: { id: string; title: string }): void {
    askRemove(note.title, () => removeNote(note.id));
  }
</script>

<template>
  <SheetPanel
    :title="SHEET_LABELS.notes"
    persistent-actions
  >
    <template #title-actions>
      <UButton
        :label="SHEET_LABELS.add"
        :icon="SHEET_ICON.add"
        color="neutral"
        variant="subtle"
        size="xs"
        @click.left.exact.prevent="addNote"
      />
    </template>

    <div
      v-for="note in document.notes"
      :key="note.id"
      class="flex flex-col gap-2 rounded-lg border border-default p-3"
    >
      <div class="flex items-center gap-2">
        <UInput
          :model-value="note.title"
          :placeholder="SHEET_LABELS.title"
          variant="ghost"
          class="min-w-0 flex-1"
          :ui="{ base: 'font-semibold' }"
          @update:model-value="patchNote(note.id, { title: String($event) })"
        />

        <UButton
          :icon="SHEET_ICON.remove"
          :aria-label="SHEET_LABELS.remove"
          color="error"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="askRemoveNote(note)"
        />
      </div>

      <UTextarea
        :model-value="note.text"
        :rows="3"
        autoresize
        class="w-full"
        @update:model-value="patchNote(note.id, { text: String($event) })"
      />
    </div>

    <p
      v-if="!document.notes.length"
      class="text-sm text-muted"
    >
      {{ SHEET_LABELS.emptyNotes }}
    </p>

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="removeTitle"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </SheetPanel>
</template>
