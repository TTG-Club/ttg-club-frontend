<script setup lang="ts">
  import type { FormError, FormSubmitEvent } from '@nuxt/ui';

  import type { MagicItemForm, WorkshopMagicItem } from '../model';

  import { MagicItemBody } from '~inventory/magic-items';
  import { magicItemDetailSchema } from '~inventory/model';

  import { useWorkshopPreview, useWorkshopSave } from '../composables';
  import {
    WorkshopFormActions,
    WorkshopNameFields,
    WorkshopSourceSelect,
  } from '../form';
  import { WorkshopHtmlEditor } from '../html-editor';
  import {
    createMagicItemForm,
    getHtmlFieldErrors,
    getMagicItemPayload,
    getWorkshopSectionRoute,
    MAGIC_ITEM_DESCRIPTION_ROWS,
    MAGIC_ITEM_EDITOR_TEXT,
    MAGIC_ITEM_RARITY_OPTIONS,
    MAGIC_ITEM_TYPE_OPTIONS,
    MAGIC_ITEMS_API_SECTION,
    MAGIC_ITEMS_WORKSHOP_KEY,
    magicItemFormSchema,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_ICON,
    WORKSHOP_TEXT,
  } from '../model';
  import { WorkshopPreviewDrawer } from '../preview';

  /** Форма магического предмета: без записи — создание нового. */
  const { magicItem = undefined } = defineProps<{
    magicItem?: WorkshopMagicItem;
  }>();

  const emit = defineEmits<{
    saved: [englishName: string];
  }>();

  const state = reactive<MagicItemForm>(createMagicItemForm(magicItem));
  const source = ref(magicItem?.source);

  const rarityItems = [...MAGIC_ITEM_RARITY_OPTIONS];
  const typeItems = [...MAGIC_ITEM_TYPE_OPTIONS];

  const cancelTo = getWorkshopSectionRoute(MAGIC_ITEMS_WORKSHOP_KEY);

  const { isSaving, save } = useWorkshopSave(
    MAGIC_ITEMS_API_SECTION,
    () => magicItem?.id,
    {
      created: MAGIC_ITEM_EDITOR_TEXT.created,
      saved: MAGIC_ITEM_EDITOR_TEXT.saved,
      error: MAGIC_ITEM_EDITOR_TEXT.saveError,
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
    MAGIC_ITEMS_API_SECTION,
    () => magicItem?.id,
    magicItemDetailSchema,
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
      await showPreview(getMagicItemPayload(data, source.value));
    }
  }

  /**
   * Ошибки разметки: бэкенд проверяет и описание, и уточнения.
   * @param form - состояние формы
   */
  function validate(form: Partial<MagicItemForm>): Array<FormError> {
    return getHtmlFieldErrors({
      description: form.description ?? '',
      special: form.special ?? '',
      custSpecial: form.custSpecial ?? '',
    });
  }

  async function submit(event: FormSubmitEvent<MagicItemForm>): Promise<void> {
    const saved = await save(getMagicItemPayload(event.data, source.value));

    if (saved) {
      emit('saved', saved.englishName);
    }
  }
</script>

<template>
  <UForm
    ref="form"
    :schema="magicItemFormSchema"
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
      :label="MAGIC_ITEM_EDITOR_TEXT.rarity"
      name="rarity"
      required
      class="col-span-2"
    >
      <USelect
        v-model="state.rarity"
        :items="rarityItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="MAGIC_ITEM_EDITOR_TEXT.type"
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
      :label="MAGIC_ITEM_EDITOR_TEXT.special"
      :help="MAGIC_ITEM_EDITOR_TEXT.specialHelp"
      name="special"
      class="col-span-2"
    >
      <UInput
        v-model="state.special"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="MAGIC_ITEM_EDITOR_TEXT.charge"
      name="charge"
    >
      <UInputNumber
        v-model="state.charge"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="MAGIC_ITEM_EDITOR_TEXT.cost"
      name="cost"
    >
      <UInputNumber
        v-model="state.cost"
        :min="0"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="MAGIC_ITEM_EDITOR_TEXT.bonus"
      name="bonus"
    >
      <UInputNumber
        v-model="state.bonus"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <div class="col-span-full flex flex-wrap items-center gap-x-6 gap-y-3">
      <UCheckbox
        v-model="state.customization"
        :label="MAGIC_ITEM_EDITOR_TEXT.customization"
      />

      <UCheckbox
        v-model="state.consumed"
        :label="MAGIC_ITEM_EDITOR_TEXT.consumed"
      />

      <UCheckbox
        v-model="state.curse"
        :label="MAGIC_ITEM_EDITOR_TEXT.curse"
      />
    </div>

    <UFormField
      :label="MAGIC_ITEM_EDITOR_TEXT.custSpecial"
      :help="MAGIC_ITEM_EDITOR_TEXT.custSpecialHelp"
      name="custSpecial"
      class="col-span-full"
    >
      <UInput
        v-model="state.custSpecial"
        class="w-full"
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
        :rows="MAGIC_ITEM_DESCRIPTION_ROWS"
      />
    </UFormField>

    <div class="col-span-full">
      <WorkshopSourceSelect v-model="source" />
    </div>

    <WorkshopFormActions
      :is-editing="!!magicItem"
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
        <MagicItemBody :item="entry" />
      </template>
    </WorkshopPreviewDrawer>
  </UForm>
</template>
