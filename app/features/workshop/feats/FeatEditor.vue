<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { FeatForm, WorkshopFeat } from '../model';

  import { useWorkshopSave } from '../composables';
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
    WORKSHOP_SKILL_OPTIONS,
  } from '../model';

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
    :schema="featFormSchema"
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
      :label="FEAT_EDITOR_TEXT.requirement"
      name="requirement"
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
      class="md:col-span-2"
      required
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="WORKSHOP_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!feat"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
    />
  </UForm>
</template>
