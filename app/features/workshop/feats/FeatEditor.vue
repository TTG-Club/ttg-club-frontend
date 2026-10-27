<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { FeatForm, WorkshopFeat } from '../model';

  import { FeatBody } from '~character/feats';
  import { featDetailSchema } from '~character/model';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createFeatForm,
    FEAT_EDITOR_TEXT,
    featFormSchema,
    FEATS_WORKSHOP_KEY,
    getFeatPayload,
    getHtmlFieldErrors,
    getWorkshopSectionRoute,
    WORKSHOP_ABILITY_OPTIONS,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_SKILL_OPTIONS,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

  /** Форма черты: без записи — создание новой. */
  const { feat = undefined } = defineProps<{
    feat?: WorkshopFeat;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<FeatForm>(createFeatForm(feat));
  const source = ref(feat?.source);

  const abilityItems = [...WORKSHOP_ABILITY_OPTIONS];
  const skillItems = [...WORKSHOP_SKILL_OPTIONS];

  const cancelTo = getWorkshopSectionRoute(FEATS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    FEATS_WORKSHOP_KEY,
    () => feat?.id,
    {
      created: FEAT_EDITOR_TEXT.created,
      saved: FEAT_EDITOR_TEXT.saved,
      error: FEAT_EDITOR_TEXT.saveError,
    },
  );

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(FEATS_WORKSHOP_KEY, () => feat?.id, featDetailSchema);

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
      await showPreview(getFeatPayload(data, source.value));
    }
  }

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<FeatForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<FeatForm>): Promise<void> {
    const saved = await save(getFeatPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="featFormSchema"
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
      :label="FEAT_EDITOR_TEXT.requirement"
      name="requirement"
      class="col-span-2 md:col-span-3"
    >
      <UInput
        v-model="state.requirement"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.level"
      name="level"
    >
      <UInputNumber
        v-model="state.level"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.abilities"
      name="abilities"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.abilities"
        :items="abilityItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.skills"
      name="skills"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.skills"
        :items="skillItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="col-span-full"
      required
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="WORKSHOP_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!feat"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
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
        <FeatBody :feat="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
