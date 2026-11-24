<script setup lang="ts">
  import type { SheetFeature } from '../model';

  import {
    FEATURE_FORM_TEXT,
    FEATURE_ORIGIN_LABELS,
    FEATURE_ORIGINS,
  } from '../model';
  import SheetMarkupField from './SheetMarkupField.vue';

  /**
   * Своя особенность, как на new.ttg.club: название, источник (вид и
   * название), что выбрано и описание в разметке. Новая и правка — одно
   * окно.
   */
  const { feature } = defineProps<{
    feature: SheetFeature | null;
  }>();

  const emit = defineEmits<{
    save: [feature: SheetFeature];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const draft = ref<SheetFeature | null>(null);

  watch(isOpen, (open) => {
    if (open && feature) {
      draft.value = { ...feature, description: [...feature.description] };
    }
  });

  const isNew = computed(() => !feature?.name);

  const title = computed(() =>
    isNew.value ? FEATURE_FORM_TEXT.createTitle : FEATURE_FORM_TEXT.editTitle,
  );

  const originItems = FEATURE_ORIGINS.map((origin) => ({
    label: FEATURE_ORIGIN_LABELS[origin].label,
    value: origin,
  }));

  const canSave = computed(() => Boolean(draft.value?.name.trim()));

  /**
   * Меняет поле черновика.
   * @param patch - изменённые поля
   */
  function patch(patch: Partial<SheetFeature>): void {
    if (draft.value) {
      draft.value = { ...draft.value, ...patch };
    }
  }

  /**
   * Вид источника.
   * @param value - пункт списка
   */
  function setOrigin(value: unknown): void {
    patch({
      origin: FEATURE_ORIGINS.find((origin) => origin === value) ?? 'custom',
    });
  }

  /**
   * Описание.
   * @param blocks - блоки разметки
   */
  function setDescription(blocks: Array<string>): void {
    patch({ description: blocks });
  }

  function save(): void {
    const current = draft.value;

    if (!current || !canSave.value) {
      return;
    }

    emit('save', {
      ...current,
      name: current.name.trim(),
      source: current.source.trim(),
      choice: current.choice.trim(),
      description: current.description.filter((block) => block.trim()),
    });

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div
        v-if="draft"
        class="grid grid-cols-2 gap-3"
      >
        <UFormField
          :label="FEATURE_FORM_TEXT.name"
          class="col-span-2"
          required
        >
          <UInput
            :model-value="draft.name"
            class="w-full"
            autofocus
            @update:model-value="patch({ name: String($event) })"
          />
        </UFormField>

        <UFormField :label="FEATURE_FORM_TEXT.origin">
          <USelect
            :model-value="draft.origin"
            :items="originItems"
            class="w-full"
            @update:model-value="setOrigin"
          />
        </UFormField>

        <UFormField :label="FEATURE_FORM_TEXT.source">
          <UInput
            :model-value="draft.source"
            :placeholder="FEATURE_FORM_TEXT.sourcePlaceholder"
            class="w-full"
            @update:model-value="patch({ source: String($event) })"
          />
        </UFormField>

        <UFormField
          :label="FEATURE_FORM_TEXT.choice"
          class="col-span-2"
        >
          <UInput
            :model-value="draft.choice"
            :placeholder="FEATURE_FORM_TEXT.choicePlaceholder"
            class="w-full"
            @update:model-value="patch({ choice: String($event) })"
          />
        </UFormField>

        <UFormField
          :label="FEATURE_FORM_TEXT.description"
          class="col-span-2"
        >
          <SheetMarkupField
            :model-value="draft.description"
            @update:model-value="setDescription"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="FEATURE_FORM_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="isNew ? FEATURE_FORM_TEXT.add : FEATURE_FORM_TEXT.save"
          :disabled="!canSave"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
