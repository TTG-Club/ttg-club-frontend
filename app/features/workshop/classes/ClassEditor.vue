<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { ClassForm, WorkshopClass } from '../model';

  import { ClassBody } from '~character/classes';
  import { classDetailSchema } from '~character/model';

  import {
    useFilterGroups,
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
    CLASS_DICE_OPTIONS,
    CLASS_EDITOR_TEXT,
    CLASS_EQUIPMENT_ROWS,
    CLASS_LEVELS,
    CLASS_REST_OPTIONS,
    CLASS_SHORT_HTML_ROWS,
    CLASS_SPELLCASTER_OPTIONS,
    CLASSES_WORKSHOP_KEY,
    classFormSchema,
    createClassForm,
    getClassHtmlFields,
    getClassPayload,
    getHtmlFieldErrors,
    getWorkshopSectionRoute,
    OPTION_TYPES_FILTER_KEY,
    OPTIONS_FILTER_PATH,
    WORKSHOP_ABILITY_OPTIONS,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_SKILL_OPTIONS,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';
  import ClassTableEditor from './ClassTableEditor.vue';
  import ClassTraitsEditor from './ClassTraitsEditor.vue';

  /** Форма класса: без записи — создание нового. */
  const { heroClass = undefined } = defineProps<{
    heroClass?: WorkshopClass;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<ClassForm>(createClassForm(heroClass));
  const source = ref(heroClass?.source);

  const diceItems = [...CLASS_DICE_OPTIONS];
  const abilityItems = [...WORKSHOP_ABILITY_OPTIONS];
  const skillItems = [...WORKSHOP_SKILL_OPTIONS];
  const spellcasterItems = [...CLASS_SPELLCASTER_OPTIONS];
  const restItems = [...CLASS_REST_OPTIONS];

  // Особенности классов берутся из фильтров особенностей, как в их редакторе
  const { isLoading: isOptionTypesLoading, getOptions } =
    useFilterGroups(OPTIONS_FILTER_PATH);

  const optionTypeItems = computed(() => getOptions(OPTION_TYPES_FILTER_KEY));

  const cancelTo = getWorkshopSectionRoute(CLASSES_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    CLASSES_WORKSHOP_KEY,
    () => heroClass?.id,
    {
      created: CLASS_EDITOR_TEXT.created,
      saved: CLASS_EDITOR_TEXT.saved,
      error: CLASS_EDITOR_TEXT.saveError,
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
    CLASSES_WORKSHOP_KEY,
    () => heroClass?.id,
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
      await showPreview(getClassPayload(data, source.value));
    }
  }

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<ClassForm>): Array<FormError> {
    return getHtmlFieldErrors(getClassHtmlFields(form));
  }

  async function submit(event: FormSubmitEvent<ClassForm>): Promise<void> {
    const saved = await save(getClassPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="classFormSchema"
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
      :label="CLASS_EDITOR_TEXT.accusativeName"
      name="accusativeName"
      class="col-span-2"
    >
      <UInput
        v-model="state.accusativeName"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.diceHp"
      name="diceHp"
      required
      class="col-span-2"
    >
      <USelect
        v-model="state.diceHp"
        :items="diceItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.primaryAbilities"
      name="primaryAbilities"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.primaryAbilities"
        :items="abilityItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.savingThrows"
      name="savingThrows"
      class="col-span-2"
    >
      <UInput
        v-model="state.savingThrows"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.skillAvailableCount"
      name="skillAvailableCount"
    >
      <UInputNumber
        v-model="state.skillAvailableCount"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.availableSkills"
      name="availableSkills"
      class="col-span-2 md:col-span-3"
    >
      <USelectMenu
        v-model="state.availableSkills"
        :items="skillItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.spellcasterType"
      name="spellcasterType"
      class="col-span-2"
    >
      <USelect
        v-model="state.spellcasterType"
        :items="spellcasterItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.spellAbility"
      name="spellAbility"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.spellAbility"
        :items="abilityItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.slotsReset"
      name="slotsReset"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.slotsReset"
        :items="restItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.archetypeName"
      name="archetypeName"
      class="col-span-2"
    >
      <UInput
        v-model="state.archetypeName"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.archetypeLevel"
      name="enabledArhitypeLevel"
    >
      <UInputNumber
        v-model="state.enabledArhitypeLevel"
        :min="0"
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
      :label="CLASS_EDITOR_TEXT.optionType"
      name="optionType"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.optionType"
        :items="optionTypeItems"
        :loading="isOptionTypesLoading"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.icon"
      name="icon"
      class="col-span-2"
    >
      <UInput
        v-model="state.icon"
        class="w-full"
      />
    </UFormField>

    <div class="flex items-center pt-6">
      <UCheckbox
        v-model="state.sidekick"
        :label="CLASS_EDITOR_TEXT.sidekick"
        name="sidekick"
      />
    </div>

    <UFormField
      :label="CLASS_EDITOR_TEXT.armor"
      name="armor"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.armor"
        :rows="CLASS_SHORT_HTML_ROWS"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.weapon"
      name="weapon"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.weapon"
        :rows="CLASS_SHORT_HTML_ROWS"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.tools"
      name="tools"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.tools"
        :rows="CLASS_SHORT_HTML_ROWS"
      />
    </UFormField>

    <UFormField
      :label="CLASS_EDITOR_TEXT.equipment"
      name="equipment"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.equipment"
        :rows="CLASS_EQUIPMENT_ROWS"
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
        v-model="state.classTraits"
        field-name="classTraits"
        has-optional
      />
    </div>

    <div class="col-span-full">
      <ClassTableEditor
        v-model="state.tableColumns"
        field-name="tableColumns"
      />
    </div>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!heroClass"
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
        <ClassBody
          :entry="entry"
          :path="entry.url"
        />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
