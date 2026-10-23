<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { BookForm, WorkshopBook } from '../model';

  import { useWorkshopSave } from '../composables';
  import { WorkshopFormActions, WorkshopNameFields } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    BOOK_DESCRIPTION_ROWS,
    BOOK_EDITOR_TEXT,
    BOOK_TYPE_OPTIONS,
    bookFormSchema,
    BOOKS_WORKSHOP_KEY,
    createBookForm,
    getBookPayload,
    getHtmlFieldErrors,
    updateWorkshopBook,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ROUTE,
  } from '../model';

  /**
   * Форма источника: источники можно только править, а аббревиатура —
   * ключ книги, поэтому она только показывается.
   */
  const { book } = defineProps<{
    book: WorkshopBook;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<BookForm>(createBookForm(book));

  const typeItems = [...BOOK_TYPE_OPTIONS];

  // Числового идентификатора у книги нет: сохраняем своей ручкой по аббревиатуре
  const { isSaving, save } = useWorkshopSave(
    BOOKS_WORKSHOP_KEY,
    () => undefined,
    {
      created: BOOK_EDITOR_TEXT.saved,
      saved: BOOK_EDITOR_TEXT.saved,
      error: BOOK_EDITOR_TEXT.saveError,
    },
    (payload) => updateWorkshopBook(book.source, payload),
  );

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<BookForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<BookForm>): Promise<void> {
    const saved = await save(getBookPayload(event.data));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="bookFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-1 gap-4 md:grid-cols-2"
    @submit="submit"
  >
    <WorkshopNameFields
      v-model:name="state.name"
      v-model:english-name="state.englishName"
      v-model:alt-name="state.altName"
    />

    <UFormField
      :label="BOOK_EDITOR_TEXT.source"
      :help="BOOK_EDITOR_TEXT.sourceHelp"
    >
      <UInput
        :model-value="book.source"
        class="w-full"
        disabled
      />
    </UFormField>

    <UFormField
      :label="BOOK_EDITOR_TEXT.type"
      name="type"
      required
    >
      <USelect
        v-model="state.type"
        :items="typeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BOOK_EDITOR_TEXT.year"
      name="year"
    >
      <UInputNumber
        v-model="state.year"
        :min="1"
        :format-options="{ useGrouping: false }"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="BOOK_DESCRIPTION_ROWS"
      />
    </UFormField>

    <WorkshopFormActions
      :is-saving="isSaving"
      :cancel-to="WORKSHOP_ROUTE"
      class="md:col-span-2"
      is-editing
    />
  </UForm>
</template>
