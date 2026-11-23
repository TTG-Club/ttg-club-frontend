<script setup lang="ts">
  import {
    CATALOG_TREE_TEXT,
    CUSTOM_CLASS_DEFAULT_HIT_DIE,
    HIT_DIE_LABEL_PREFIX,
    HIT_DIE_SIZES,
  } from '../model';

  /**
   * Своя запись вместо записи справочника: название, а у класса ещё кость
   * хитов.
   */
  const {
    title,
    hint,
    withHitDie = false,
  } = defineProps<{
    title: string;
    hint: string;
    /** Спрашивать кость хитов (свой класс). */
    withHitDie?: boolean;
  }>();

  const emit = defineEmits<{
    save: [name: string, hitDie: number];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const name = ref('');

  const hitDie = ref<(typeof HIT_DIE_SIZES)[number]>(
    CUSTOM_CLASS_DEFAULT_HIT_DIE,
  );

  const hitDieOptions = HIT_DIE_SIZES.map((size) => ({
    label: `${HIT_DIE_LABEL_PREFIX}${size}`,
    value: size,
  }));

  const canSave = computed(() => Boolean(name.value.trim()));

  function save(): void {
    if (!canSave.value) {
      return;
    }

    emit('save', name.value.trim(), hitDie.value);
    isOpen.value = false;
  }

  function close(): void {
    isOpen.value = false;
  }

  watch(isOpen, (open) => {
    if (open) {
      name.value = '';
      hitDie.value = CUSTOM_CLASS_DEFAULT_HIT_DIE;
    }
  });
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <UFormField :label="CATALOG_TREE_TEXT.customName">
        <UInput
          v-model="name"
          autofocus
          class="w-full"
          @keydown.enter.exact.prevent="save"
        />
      </UFormField>

      <UFormField
        v-if="withHitDie"
        :label="CATALOG_TREE_TEXT.customHitDie"
      >
        <USelect
          v-model="hitDie"
          :items="hitDieOptions"
          class="w-full"
        />
      </UFormField>

      <span class="text-xs text-muted">{{ hint }}</span>
    </template>

    <template #footer>
      <div class="ml-auto flex gap-2">
        <UButton
          :label="CATALOG_TREE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="CATALOG_TREE_TEXT.save"
          color="primary"
          :disabled="!canSave"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
