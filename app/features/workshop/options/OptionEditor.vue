<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { OptionForm, WorkshopOption } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_FORM_CONTEXT, EFFECT_ORIGIN } from '~active-effects/model';
  import { optionDetailSchema } from '~character/model';
  import { OptionBody } from '~character/options';

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
  import { MarkupEditor } from '../markup-editor';
  import { WorkshopMechanicsEditor } from '../mechanics';
  import {
    createOptionForm,
    getOptionPayload,
    getWorkshopSectionRoute,
    MECHANICS_KIND,
    MECHANICS_TEXT,
    OPTION_EDITOR_TEXT,
    OPTION_TYPES_FILTER_KEY,
    optionFormSchema,
    OPTIONS_FILTER_PATH,
    OPTIONS_WORKSHOP_KEY,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

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

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(
    OPTIONS_WORKSHOP_KEY,
    () => option?.id,
    optionDetailSchema,
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
      await showPreview(getOptionPayload(data, source.value));
    }
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
    ref="form"
    :schema="optionFormSchema"
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
      :label="OPTION_EDITOR_TEXT.prerequisite"
      name="prerequisite"
      class="col-span-2 md:col-span-3"
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
      class="col-span-full"
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
      class="col-span-full"
      required
    >
      <MarkupEditor v-model="state.description" />
    </UFormField>

    <WorkshopMechanicsEditor
      v-model="state.mechanics"
      :kind="MECHANICS_KIND.class"
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
      :is-editing="!!option"
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
        <OptionBody :option="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
