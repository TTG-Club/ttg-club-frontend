<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { OptionForm, WorkshopOption } from '../model';

  import { useFilterGroups, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createOptionForm,
    getHtmlFieldErrors,
    getOptionPayload,
    getWorkshopSectionRoute,
    OPTION_EDITOR_TEXT,
    OPTION_TYPES_FILTER_KEY,
    optionFormSchema,
    OPTIONS_FILTER_PATH,
    OPTIONS_WORKSHOP_KEY,
    WORKSHOP_DESCRIPTION_ROWS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Форма особенности класса: без записи — создание новой. */
  const { option = undefined } = defineProps<{
    option?: WorkshopOption;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<OptionForm>(createOptionForm(option));
  const source = ref(option?.source);

  // Типы берутся из фильтров, чтобы список не расходился с бэкендом
  const { isLoading: isTypesLoading, getOptions } =
    useFilterGroups(OPTIONS_FILTER_PATH);

  const typeItems = computed(() => getOptions(OPTION_TYPES_FILTER_KEY));

  const cancelTo = getWorkshopSectionRoute(OPTIONS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    OPTIONS_WORKSHOP_KEY,
    () => option?.id,
    {
      created: OPTION_EDITOR_TEXT.created,
      saved: OPTION_EDITOR_TEXT.saved,
      error: OPTION_EDITOR_TEXT.saveError,
    },
  );

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<OptionForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<OptionForm>): Promise<void> {
    const saved = await save(getOptionPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="optionFormSchema"
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
      :label="OPTION_EDITOR_TEXT.prerequisite"
      name="prerequisite"
    >
      <UInput
        v-model="state.prerequisite"
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
      :label="OPTION_EDITOR_TEXT.optionTypes"
      name="optionTypes"
      class="md:col-span-2"
      required
    >
      <USelectMenu
        v-model="state.optionTypes"
        :items="typeItems"
        :loading="isTypesLoading"
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
      :is-editing="!!option"
      :is-saving="isSaving"
      :cancel-to="cancelTo"
      class="md:col-span-2"
    />
  </UForm>
</template>
