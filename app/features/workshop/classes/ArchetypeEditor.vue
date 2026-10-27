<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { ArchetypeForm, WorkshopArchetype } from '../model';

  import { ClassBody } from '~character/classes';
  import { classDetailSchema } from '~character/model';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
  import { WorkshopFormActions, WorkshopNameFields } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    ARCHETYPE_EDITOR_TEXT,
    ARCHETYPE_SPELL_LEVEL_OPTIONS,
    archetypeFormSchema,
    ARCHETYPES_API_SECTION,
    CLASS_LEVELS,
    createArchetypeForm,
    getArchetypeHtmlFields,
    getArchetypePayload,
    getArchetypePreviewPath,
    getHtmlFieldErrors,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';
  import ClassTableEditor from './ClassTableEditor.vue';
  import ClassTraitsEditor from './ClassTraitsEditor.vue';

  /** Форма архетипа: архетипы только правятся, создаются они в базе. */
  const { archetype, cancelTo } = defineProps<{
    archetype: WorkshopArchetype;
    /** Куда ведёт отмена: страница архетипа в справочнике. */
    cancelTo: string;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<ArchetypeForm>(createArchetypeForm(archetype));

  const spellLevelItems = [...ARCHETYPE_SPELL_LEVEL_OPTIONS];

  const { isSaving, save } = useWorkshopSave(
    ARCHETYPES_API_SECTION,
    () => archetype.id,
    {
      created: ARCHETYPE_EDITOR_TEXT.saved,
      saved: ARCHETYPE_EDITOR_TEXT.saved,
      error: ARCHETYPE_EDITOR_TEXT.saveError,
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
    ARCHETYPES_API_SECTION,
    () => archetype.id,
    classDetailSchema,
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
      await showPreview(getArchetypePayload(data, archetype));
    }
  }

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<ArchetypeForm>): Array<FormError> {
    return getHtmlFieldErrors(getArchetypeHtmlFields(form));
  }

  async function submit(event: FormSubmitEvent<ArchetypeForm>): Promise<void> {
    const saved = await save(getArchetypePayload(event.data, archetype));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="archetypeFormSchema"
    :state="state"
    :validate="validate"
    class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4"
    @submit="submit"
  >
    <WorkshopNameFields
      v-model:name="state.name"
      v-model:english-name="state.englishName"
    />

    <UFormField
      :label="ARCHETYPE_EDITOR_TEXT.genitiveName"
      name="genitiveName"
      class="col-span-2"
    >
      <UInput
        v-model="state.genitiveName"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ARCHETYPE_EDITOR_TEXT.level"
      name="level"
      required
    >
      <UInputNumber
        v-model="state.level"
        :min="1"
        :max="CLASS_LEVELS.length"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.page"
      name="page"
    >
      <UInputNumber
        v-model="state.page"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ARCHETYPE_EDITOR_TEXT.spellLevelType"
      name="spellLevelType"
      class="col-span-2"
    >
      <USelect
        v-model="state.spellLevelType"
        :items="spellLevelItems"
        class="w-full"
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
      <ClassTraitsEditor
        v-model="state.traits"
        field-name="traits"
      />
    </div>

    <div class="col-span-full">
      <ClassTableEditor
        v-model="state.tableColumns"
        field-name="tableColumns"
      />
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
        <ClassBody
          :entry="entry"
          :path="getArchetypePreviewPath(entry, state.englishName)"
        />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
