<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { ScreenForm, WorkshopScreen } from '../model';

  import { screenDetailSchema } from '~wiki/model';
  import { ScreenBody } from '~wiki/screens';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
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
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

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

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(
    SCREENS_WORKSHOP_KEY,
    () => screen.id,
    screenDetailSchema,
  );

  /**
   * Предпросмотр по текущим данным формы. С ошибками в форме он не
   * открывается: ошибки подсвечиваются у полей, как при сохранении.
   */
  async function openPreview(): Promise<void> {
    const data = await editorForm.value?.validate({
      transform: true,
      silent: true,
    });

    if (data) {
      await showPreview(getScreenPayload(data, screen, source.value));
    }
  }

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
    ref="form"
    :schema="screenFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4"
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
      class="col-span-2"
    >
      <UInput
        v-model="state.category"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SCREEN_EDITOR_TEXT.icon"
      name="icon"
      class="col-span-2"
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
      class="col-span-2 md:col-span-3"
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
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="SCREEN_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      is-editing
    >
      <UButton
        :label="WORKSHOP_TEXT.preview"
        :icon="WORKSHOP_ICON.preview"
        :loading="isPreviewLoading"
        color="neutral"
        variant="soft"
        @click.left.exact.prevent="openPreview"
      />
    </WorkshopFormActions>

    <WorkshopPreviewDrawer
      v-model:open="isPreviewOpen"
      :entry="previewEntry"
      :is-loading="isPreviewLoading"
      :is-error="isPreviewError"
    >
      <template #default="{ entry }">
        <ScreenBody :screen="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
