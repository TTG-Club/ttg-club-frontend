<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { ItemForm, WorkshopItem } from '../model';

  import { ItemBody } from '~inventory/items';
  import { itemDetailSchema } from '~inventory/model';

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
    createItemForm,
    getHtmlFieldErrors,
    getItemPayload,
    getWorkshopSectionRoute,
    ITEM_CATEGORIES_FILTER_KEY,
    ITEM_DESCRIPTION_ROWS,
    ITEM_EDITOR_TEXT,
    itemFormSchema,
    ITEMS_FILTER_PATH,
    ITEMS_WORKSHOP_KEY,
    WORKSHOP_CURRENCY_OPTIONS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
    WORKSHOP_WEIGHT_STEP,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

  /** Форма снаряжения: без записи — создание нового. */
  const { item = undefined } = defineProps<{
    item?: WorkshopItem;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<ItemForm>(createItemForm(item));
  const source = ref(item?.source);

  const currencyItems = [...WORKSHOP_CURRENCY_OPTIONS];

  // Категории берутся из фильтров, чтобы список не расходился с бэкендом
  const { isLoading: isCategoriesLoading, getOptions } =
    useFilterGroups(ITEMS_FILTER_PATH);

  const categoryItems = computed(() => getOptions(ITEM_CATEGORIES_FILTER_KEY));

  const cancelTo = getWorkshopSectionRoute(ITEMS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    ITEMS_WORKSHOP_KEY,
    () => item?.id,
    {
      created: ITEM_EDITOR_TEXT.created,
      saved: ITEM_EDITOR_TEXT.saved,
      error: ITEM_EDITOR_TEXT.saveError,
    },
  );

  const editorForm = useTemplateRef('form');

  const {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview(ITEMS_WORKSHOP_KEY, () => item?.id, itemDetailSchema);

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
      await showPreview(getItemPayload(data, source.value));
    }
  }

  /**
   * Ошибки разметки описания: бэкенд не примет такой текст.
   * @param form - состояние формы
   */
  function validate(form: Partial<ItemForm>): Array<FormError> {
    return getHtmlFieldErrors({ description: form.description ?? '' });
  }

  async function submit(event: FormSubmitEvent<ItemForm>): Promise<void> {
    const saved = await save(getItemPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="itemFormSchema"
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
      :label="ITEM_EDITOR_TEXT.categories"
      name="categories"
      class="col-span-2"
    >
      <USelectMenu
        v-model="state.categories"
        :items="categoryItems"
        :loading="isCategoriesLoading"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.cost"
      name="cost"
    >
      <UInputNumber
        v-model="state.cost"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.currency"
      name="currency"
    >
      <USelectMenu
        v-model="state.currency"
        :items="currencyItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="WORKSHOP_FIELD_TEXT.weight"
      :help="WORKSHOP_FIELD_TEXT.weightHelp"
      name="weight"
    >
      <UInputNumber
        v-model="state.weight"
        :min="0"
        :step="WORKSHOP_WEIGHT_STEP"
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
        :rows="ITEM_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!item"
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
        <ItemBody :item="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
