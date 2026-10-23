<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { BackgroundForm, WorkshopBackground } from '../model';

  import { useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    BACKGROUND_EDITOR_TEXT,
    BACKGROUND_SKILL_ROWS,
    backgroundFormSchema,
    BACKGROUNDS_WORKSHOP_KEY,
    createBackgroundForm,
    getBackgroundPayload,
    getHtmlFieldErrors,
    getWorkshopSectionRoute,
    LIFE_STYLE_OPTIONS,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_SKILL_OPTIONS,
  } from '../model';
  import PersonalizationTablesEditor from './PersonalizationTablesEditor.vue';

  /** Форма предыстории: без записи — создание новой. */
  const { background = undefined } = defineProps<{
    background?: WorkshopBackground;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<BackgroundForm>(createBackgroundForm(background));
  const source = ref(background?.source);

  const skillItems = [...WORKSHOP_SKILL_OPTIONS];
  const lifeStyleItems = [...LIFE_STYLE_OPTIONS];

  const cancelTo = getWorkshopSectionRoute(BACKGROUNDS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    BACKGROUNDS_WORKSHOP_KEY,
    () => background?.id,
    {
      created: BACKGROUND_EDITOR_TEXT.created,
      saved: BACKGROUND_EDITOR_TEXT.saved,
      error: BACKGROUND_EDITOR_TEXT.saveError,
    },
  );

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<BackgroundForm>): Array<FormError> {
    return getHtmlFieldErrors({
      description: form.description ?? '',
      skillDescription: form.skillDescription ?? '',
      personalization: form.personalization ?? '',
    });
  }

  async function submit(event: FormSubmitEvent<BackgroundForm>): Promise<void> {
    const saved = await save(getBackgroundPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="backgroundFormSchema"
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
      :label="BACKGROUND_EDITOR_TEXT.lifeStyle"
      name="lifeStyle"
    >
      <USelectMenu
        v-model="state.lifeStyle"
        :items="lifeStyleItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        clear
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
      :label="BACKGROUND_EDITOR_TEXT.otherSkills"
      :help="BACKGROUND_EDITOR_TEXT.otherSkillsHelp"
      name="otherSkills"
    >
      <UInput
        v-model="state.otherSkills"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.toolOwnership"
      name="toolOwnership"
    >
      <UInput
        v-model="state.toolOwnership"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.startGold"
      name="startGold"
    >
      <UInputNumber
        v-model="state.startGold"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.equipments"
      :help="BACKGROUND_EDITOR_TEXT.listHelp"
      name="equipments"
      class="md:col-span-2"
    >
      <UInput
        v-model="state.equipments"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.languages"
      :help="BACKGROUND_EDITOR_TEXT.listHelp"
      name="languages"
    >
      <UInput
        v-model="state.languages"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.language"
      :help="BACKGROUND_EDITOR_TEXT.languageHelp"
      name="language"
    >
      <UInput
        v-model="state.language"
        class="w-full"
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

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.skillName"
      name="skillName"
      class="md:col-span-2"
    >
      <UInput
        v-model="state.skillName"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.skillDescription"
      name="skillDescription"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.skillDescription"
        :rows="BACKGROUND_SKILL_ROWS"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.personalization"
      name="personalization"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.personalization"
        :rows="BACKGROUND_SKILL_ROWS"
      />
    </UFormField>

    <div class="md:col-span-2">
      <PersonalizationTablesEditor v-model="state.personalizationTables" />
    </div>

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!background"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
    />
  </UForm>
</template>
