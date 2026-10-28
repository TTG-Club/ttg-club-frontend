<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { SpellForm, WorkshopSpell } from '../model';

  import { spellDetailSchema } from '~character/model';
  import { SpellBody } from '~character/spells';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
  import { WorkshopFormActions, WorkshopSourceSelect } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createSpellForm,
    getHtmlFieldErrors,
    getSpellPayload,
    getWorkshopSectionRoute,
    SPELL_DESCRIPTION_ROWS,
    SPELL_EDITOR_TEXT,
    SPELL_MAX_LEVEL,
    SPELL_SCHOOL_OPTIONS,
    SPELL_TIME_UNIT_OPTIONS,
    SPELL_UPPER_ROWS,
    spellFormSchema,
    SPELLS_WORKSHOP_KEY,
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

  /** Форма заклинания: без записи — создание нового. */
  const { spell = undefined } = defineProps<{
    spell?: WorkshopSpell;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<SpellForm>(createSpellForm(spell));
  const source = ref(spell?.source);

  const schoolItems = SPELL_SCHOOL_OPTIONS.map(({ label, value }) => ({
    label,
    value,
  }));

  const timeUnitItems = SPELL_TIME_UNIT_OPTIONS.map(({ label, value }) => ({
    label,
    value,
  }));

  const cancelTo = getWorkshopSectionRoute(SPELLS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    SPELLS_WORKSHOP_KEY,
    () => spell?.id,
    {
      created: SPELL_EDITOR_TEXT.created,
      saved: SPELL_EDITOR_TEXT.saved,
      error: SPELL_EDITOR_TEXT.saveError,
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
    SPELLS_WORKSHOP_KEY,
    () => spell?.id,
    spellDetailSchema,
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
      await showPreview(getSpellPayload(data, source.value));
    }
  }

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<SpellForm>): Array<FormError> {
    return getHtmlFieldErrors({
      description: form.description ?? '',
      upper: form.upper ?? '',
    });
  }

  async function submit(event: FormSubmitEvent<SpellForm>): Promise<void> {
    const saved = await save(getSpellPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="spellFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4"
    @submit="submit"
  >
    <UFormField
      :label="SPELL_EDITOR_TEXT.name"
      name="name"
      required
      class="col-span-2"
    >
      <UInput
        v-model="state.name"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.englishName"
      name="englishName"
      required
      class="col-span-2"
    >
      <UInput
        v-model="state.englishName"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.level"
      :help="SPELL_EDITOR_TEXT.levelHelp"
      name="level"
      required
    >
      <UInputNumber
        v-model="state.level"
        :min="0"
        :max="SPELL_MAX_LEVEL"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.school"
      name="school"
      required
    >
      <USelect
        v-model="state.school"
        :items="schoolItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.additionalType"
      name="additionalType"
      class="col-span-2"
    >
      <UInput
        v-model="state.additionalType"
        class="w-full"
      />
    </UFormField>

    <div class="col-span-full flex flex-wrap items-center gap-x-6 gap-y-3">
      <UCheckbox
        v-model="state.ritual"
        :label="SPELL_EDITOR_TEXT.ritual"
      />

      <UCheckbox
        v-model="state.concentration"
        :label="SPELL_EDITOR_TEXT.concentration"
      />

      <UCheckbox
        v-model="state.verbalComponent"
        :label="SPELL_EDITOR_TEXT.verbal"
      />

      <UCheckbox
        v-model="state.somaticComponent"
        :label="SPELL_EDITOR_TEXT.somatic"
      />

      <UCheckbox
        v-model="state.consumable"
        :label="SPELL_EDITOR_TEXT.consumable"
      />
    </div>

    <UFormField
      :label="SPELL_EDITOR_TEXT.material"
      name="materialComponent"
      class="col-span-full"
    >
      <UInput
        v-model="state.materialComponent"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.timeNumber"
      name="timeNumber"
      required
    >
      <UInputNumber
        v-model="state.timeNumber"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.timeUnit"
      name="timeUnit"
      required
    >
      <USelect
        v-model="state.timeUnit"
        :items="timeUnitItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.timeCondition"
      name="timeCondition"
      class="col-span-2"
    >
      <UInput
        v-model="state.timeCondition"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.range"
      name="range"
      required
      class="col-span-2"
    >
      <UInput
        v-model="state.range"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.duration"
      name="duration"
      required
      class="col-span-2"
    >
      <UInput
        v-model="state.duration"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.description"
      name="description"
      class="col-span-full"
      required
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="SPELL_DESCRIPTION_ROWS"
      />
    </UFormField>

    <UFormField
      :label="SPELL_EDITOR_TEXT.upper"
      name="upper"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.upper"
        :rows="SPELL_UPPER_ROWS"
      />
    </UFormField>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!spell"
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
        <SpellBody :spell="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
