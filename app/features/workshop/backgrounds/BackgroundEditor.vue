<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { BackgroundForm, WorkshopBackground } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_FORM_CONTEXT, EFFECT_ORIGIN } from '~active-effects/model';
  import { BackgroundBody } from '~character/backgrounds';
  import { backgroundDetailSchema } from '~character/model';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { MarkupEditor } from '../markup-editor';
  import { WorkshopMechanicsEditor } from '../mechanics';
  import {
    BACKGROUND_EDITOR_TEXT,
    backgroundFormSchema,
    BACKGROUNDS_WORKSHOP_KEY,
    createBackgroundForm,
    getBackgroundPayload,
    getWorkshopSectionRoute,
    LIFE_STYLE_OPTIONS,
    MECHANICS_KIND,
    MECHANICS_TEXT,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_SKILL_OPTIONS,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';
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

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(
    BACKGROUNDS_WORKSHOP_KEY,
    () => background?.id,
    backgroundDetailSchema,
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
      await showPreview(getBackgroundPayload(data, source.value));
    }
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
    ref="form"
    :schema="backgroundFormSchema"
    :state="state"
    class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4"
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
      class="col-span-2"
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
      :label="BACKGROUND_EDITOR_TEXT.otherSkills"
      :help="BACKGROUND_EDITOR_TEXT.otherSkillsHelp"
      name="otherSkills"
      class="col-span-2"
    >
      <UInput
        v-model="state.otherSkills"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.toolOwnership"
      name="toolOwnership"
      class="col-span-2"
    >
      <MarkupEditor v-model="state.toolOwnership" />
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
      class="col-span-full"
    >
      <MarkupEditor v-model="state.equipments" />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.languages"
      :help="BACKGROUND_EDITOR_TEXT.listHelp"
      name="languages"
      class="col-span-2"
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
      class="col-span-2"
    >
      <UInput
        v-model="state.language"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="col-span-full"
      required
    >
      <MarkupEditor v-model="state.description" />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.skillName"
      name="skillName"
      class="col-span-full"
    >
      <UInput
        v-model="state.skillName"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.skillDescription"
      name="skillDescription"
      class="col-span-full"
    >
      <MarkupEditor v-model="state.skillDescription" />
    </UFormField>

    <UFormField
      :label="BACKGROUND_EDITOR_TEXT.personalization"
      name="personalization"
      class="col-span-full"
    >
      <MarkupEditor v-model="state.personalization" />
    </UFormField>

    <div class="col-span-full">
      <PersonalizationTablesEditor v-model="state.personalizationTables" />
    </div>

    <WorkshopMechanicsEditor
      v-model="state.mechanics"
      :kind="MECHANICS_KIND.feat"
    />

    <div class="col-span-full">
      <ActiveEffects
        v-model="state.activeEffects"
        :context="EFFECT_FORM_CONTEXT.feature"
        :origin="EFFECT_ORIGIN.feature"
        :title="MECHANICS_TEXT.effectsTitle"
      />
    </div>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!background"
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
        <BackgroundBody :background="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
