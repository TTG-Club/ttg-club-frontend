<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { RaceForm, WorkshopRace } from '../model';

  import { useRaceParentOptions, useWorkshopSave } from '../composables';
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
    getWorkshopSectionRoute,
    RACE_EDITOR_TEXT,
    RACE_SIZE_OPTIONS,
    RACE_TYPE_OPTIONS,
    raceFormSchema,
    RACES_WORKSHOP_KEY,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';
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
    :schema="raceFormSchema"
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
      :label="RACE_EDITOR_TEXT.parent"
      :help="RACE_EDITOR_TEXT.parentHelp"
      name="parentId"
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
      :help="RACE_EDITOR_TEXT.feetHelp"
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
      :help="RACE_EDITOR_TEXT.feetHelp"
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
      :help="RACE_EDITOR_TEXT.feetHelp"
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
      :help="RACE_EDITOR_TEXT.feetHelp"
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
      :help="RACE_EDITOR_TEXT.feetHelp"
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

    <div class="flex flex-col gap-3 md:col-span-2">
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

    <div class="md:col-span-2">
      <RaceAbilitiesEditor v-model="state.abilities" />
    </div>

    <div class="md:col-span-2">
      <RaceFeaturesEditor v-model="state.features" />
    </div>

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
      :is-editing="!!race"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
    />
  </UForm>
</template>
