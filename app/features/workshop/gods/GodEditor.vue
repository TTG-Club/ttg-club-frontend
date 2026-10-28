<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { GodForm, WorkshopGod } from '../model';

  import { GodBody } from '~wiki/gods';
  import { godDetailSchema } from '~wiki/model';

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
    WORKSHOP_ICON,
    WORKSHOP_ROUTE,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

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

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(GODS_WORKSHOP_KEY, () => god.id, godDetailSchema);

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
      await showPreview(getGodPayload(data, source.value));
    }
  }

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
    ref="form"
    :schema="godFormSchema"
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
      :label="GOD_EDITOR_TEXT.commitment"
      name="commitment"
      class="col-span-2"
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
      class="col-span-2"
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
      class="col-span-2"
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
      class="col-span-2"
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
      class="col-span-2"
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
      :label="GOD_EDITOR_TEXT.domains"
      name="domains"
      class="col-span-full"
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
      class="col-span-2"
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
      class="col-span-2"
    >
      <UInput
        v-model="state.nicknames"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.description"
      name="description"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.description"
        :rows="GOD_DESCRIPTION_ROWS"
      />
    </UFormField>

    <UFormField
      :label="GOD_EDITOR_TEXT.alternativeDescription"
      name="alternativeDescription"
      class="col-span-full"
    >
      <WorkshopHtmlEditor
        v-model="state.alternativeDescription"
        :rows="GOD_ALTERNATIVE_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-saving="isSaving"
      :cancel-to="WORKSHOP_ROUTE"
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
        <GodBody :god="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
