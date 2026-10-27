<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { RaceForm, WorkshopRace } from '../model';

  import { raceDetailSchema } from '~character/model';
  import { RaceBody } from '~character/races';

  import {
    useRaceParentOptions,
    useWorkshopPreview,
    useWorkshopSave,
  } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createRaceForm,
    getHtmlFieldErrors,
    getRaceHtmlFields,
    getRacePayload,
    getRacePreviewPath,
    getWorkshopSectionRoute,
    RACE_EDITOR_TEXT,
    RACE_SIZE_OPTIONS,
    RACE_TYPE_OPTIONS,
    raceFormSchema,
    RACES_WORKSHOP_KEY,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';
  import RaceAbilitiesEditor from './RaceAbilitiesEditor.vue';
  import RaceFeaturesEditor from './RaceFeaturesEditor.vue';

  /** Форма расы: без записи — создание новой. */
  const { race = undefined } = defineProps<{
    race?: WorkshopRace;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<RaceForm>(createRaceForm(race));
  const source = ref(race?.source);

  const sizeItems = [...RACE_SIZE_OPTIONS];
  const typeItems = [...RACE_TYPE_OPTIONS];

  const { isLoading: isParentsLoading, options: parentItems } =
    useRaceParentOptions(race?.id);

  const cancelTo = getWorkshopSectionRoute(RACES_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    RACES_WORKSHOP_KEY,
    () => race?.id,
    {
      created: RACE_EDITOR_TEXT.created,
      saved: RACE_EDITOR_TEXT.saved,
      error: RACE_EDITOR_TEXT.saveError,
    },
  );

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(RACES_WORKSHOP_KEY, () => race?.id, raceDetailSchema);

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
      await showPreview(getRacePayload(data, source.value));
    }
  }

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<RaceForm>): Array<FormError> {
    return getHtmlFieldErrors(getRaceHtmlFields(form));
  }

  async function submit(event: FormSubmitEvent<RaceForm>): Promise<void> {
    const saved = await save(getRacePayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="raceFormSchema"
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
      :label="RACE_EDITOR_TEXT.parent"
      :help="RACE_EDITOR_TEXT.parentHelp"
      name="parentId"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.parentId"
        :items="parentItems"
        :loading="isParentsLoading"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.size"
      name="size"
      required
      class="col-span-2"
    >
      <USelect
        v-model="state.size"
        :items="sizeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.creatureType"
      name="type"
      required
      class="col-span-2"
    >
      <USelect
        v-model="state.type"
        :items="typeItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.minAge"
      name="minAge"
    >
      <UInputNumber
        v-model="state.minAge"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.maxAge"
      name="maxAge"
    >
      <UInputNumber
        v-model="state.maxAge"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.speed"
      name="speed"
      required
    >
      <UInputNumber
        v-model="state.speed"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.darkvision"
      name="darkvision"
    >
      <UInputNumber
        v-model="state.darkvision"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.fly"
      name="fly"
    >
      <UInputNumber
        v-model="state.fly"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.climb"
      name="climb"
    >
      <UInputNumber
        v-model="state.climb"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.swim"
      name="swim"
    >
      <UInputNumber
        v-model="state.swim"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="RACE_EDITOR_TEXT.icon"
      name="icon"
      class="col-span-2"
    >
      <UInput
        v-model="state.icon"
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

    <div class="col-span-full flex flex-wrap gap-x-6 gap-y-3">
      <UCheckbox
        v-model="state.origin"
        :label="RACE_EDITOR_TEXT.origin"
        name="origin"
      />

      <UCheckbox
        v-model="state.view"
        :label="RACE_EDITOR_TEXT.view"
        name="view"
      />
    </div>

    <div class="col-span-full">
      <RaceAbilitiesEditor v-model="state.abilities" />
    </div>

    <div class="col-span-full">
      <RaceFeaturesEditor v-model="state.features" />
    </div>

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
      :is-editing="!!race"
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
        <RaceBody
          :race="entry"
          :path="getRacePreviewPath(entry, state.englishName)"
        />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
