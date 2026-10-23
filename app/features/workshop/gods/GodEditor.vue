<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { GodForm, WorkshopGod } from '../model';

  import { useFilterGroups, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createGodForm,
    getGodPayload,
    getHtmlFieldErrors,
    GOD_ALTERNATIVE_DESCRIPTION_ROWS,
    GOD_DESCRIPTION_ROWS,
    GOD_EDITOR_TEXT,
    GOD_FILTER_KEY,
    GOD_SEX_OPTIONS,
    godFormSchema,
    GODS_FILTER_PATH,
    GODS_WORKSHOP_KEY,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ROUTE,
  } from '../model';

  /** Форма божества: богов можно только править. */
  const { god } = defineProps<{
    god: WorkshopGod;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<GodForm>(createGodForm(god));
  const source = ref(god.source);

  const sexItems = [...GOD_SEX_OPTIONS];

  // Ранги, мировоззрения, домены и пантеоны берутся из фильтров богов
  const { isLoading: isFiltersLoading, getOptions } =
    useFilterGroups(GODS_FILTER_PATH);

  const rankItems = computed(() => getOptions(GOD_FILTER_KEY.rank));
  const alignmentItems = computed(() => getOptions(GOD_FILTER_KEY.alignment));
  const pantheonItems = computed(() => getOptions(GOD_FILTER_KEY.pantheon));
  const domainItems = computed(() => getOptions(GOD_FILTER_KEY.domain));

  const { isSaving, save } = useWorkshopSave(GODS_WORKSHOP_KEY, () => god.id, {
    created: GOD_EDITOR_TEXT.saved,
    saved: GOD_EDITOR_TEXT.saved,
    error: GOD_EDITOR_TEXT.saveError,
  });

  /**
   * Ошибки разметки описаний: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<GodForm>): Array<FormError> {
    return getHtmlFieldErrors({
      description: form.description ?? '',
      alternativeDescription: form.alternativeDescription ?? '',
    });
  }

  async function submit(event: FormSubmitEvent<GodForm>): Promise<void> {
    const saved = await save(getGodPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    :schema="godFormSchema"
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
      :label="GOD_EDITOR_TEXT.commitment"
      name="commitment"
    >
      <UInput
        v-model="state.commitment"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.sex"
      name="sex"
      required
    >
      <USelect
        v-model="state.sex"
        :items="sexItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.rank"
      name="rank"
      required
    >
      <USelect
        v-model="state.rank"
        :items="rankItems"
        :loading="isFiltersLoading"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.alignment"
      name="alignment"
      required
    >
      <USelect
        v-model="state.alignment"
        :items="alignmentItems"
        :loading="isFiltersLoading"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.pantheon"
      name="pantheonId"
      required
    >
      <USelectMenu
        v-model="state.pantheonId"
        :items="pantheonItems"
        :loading="isFiltersLoading"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.domains"
      name="domains"
      class="md:col-span-2"
      required
    >
      <USelectMenu
        v-model="state.domains"
        :items="domainItems"
        :loading="isFiltersLoading"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.symbol"
      name="symbol"
    >
      <UInput
        v-model="state.symbol"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.nicknames"
      :help="GOD_EDITOR_TEXT.nicknamesHelp"
      name="nicknames"
    >
      <UInput
        v-model="state.nicknames"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="GOD_DESCRIPTION_ROWS"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.alternativeDescription"
      name="alternativeDescription"
      class="md:col-span-2"
    >
      <WorkshopHtmlEditor
        v-model="state.alternativeDescription"
        :rows="GOD_ALTERNATIVE_DESCRIPTION_ROWS"
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

    <div class="md:col-span-2">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-saving="isSaving"
      :cancel-to="WORKSHOP_ROUTE"
      class="md:col-span-2"
      is-editing
    />
  </UForm>
</template>
