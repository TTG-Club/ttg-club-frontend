<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { ScreenForm, WorkshopScreen } from '../model';

  import { useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createScreenForm,
    getHtmlFieldErrors,
    getScreenPayload,
    getScreenReferenceRoute,
    SCREEN_DESCRIPTION_ROWS,
    SCREEN_EDITOR_TEXT,
    screenFormSchema,
    SCREENS_WORKSHOP_KEY,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Форма раздела ширмы мастера: разделы можно только править. */
  const { screen } = defineProps<{
    screen: WorkshopScreen;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<ScreenForm>(createScreenForm(screen));
  const source = ref(screen.source);

  const cancelTo = getScreenReferenceRoute(screen);

  const { isSaving, save } = useWorkshopSave(
    SCREENS_WORKSHOP_KEY,
    () => screen.id,
    {
      created: SCREEN_EDITOR_TEXT.saved,
      saved: SCREEN_EDITOR_TEXT.saved,
      error: SCREEN_EDITOR_TEXT.saveError,
    },
  );

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<ScreenForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<ScreenForm>): Promise<void> {
    const saved = await save(
      getScreenPayload(event.data, screen, source.value),
    );

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="screenFormSchema"
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
      :label="SCREEN_EDITOR_TEXT.category"
      name="category"
    >
      <UInput
        v-model="state.category"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SCREEN_EDITOR_TEXT.icon"
      name="icon"
    >
      <UInput
        v-model="state.icon"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SCREEN_EDITOR_TEXT.order"
      name="order"
    >
      <UInputNumber
        v-model="state.order"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="screen.parent"
      :label="SCREEN_EDITOR_TEXT.parent"
    >
      <UButton
        :to="screen.parent.url"
        :label="screen.parent.name"
        class="px-0"
        variant="link"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="SCREEN_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
      is-editing
    />
  </UForm>
</template>
