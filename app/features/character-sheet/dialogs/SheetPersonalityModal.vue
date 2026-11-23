<script setup lang="ts">
  import type { SheetPersonality } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    ALIGNMENTS,
    PERSONALITY_TEXT,
    PERSONALITY_TRAIT_FIELDS,
    PERSONALITY_TRAIT_MAX_LENGTH,
    SHEET_LABELS,
  } from '../model';

  /** Ключ краткой приметы. */
  type TraitKey = (typeof PERSONALITY_TRAIT_FIELDS)[number]['key'];

  /**
   * Приметы, как на new.ttg.club: мировоззрение из списка PHB (своё
   * значение остаётся) и краткие приметы. Окно открывается с фокусом на
   * поле, по плитке которого кликнули.
   */
  const { focusField = null } = defineProps<{
    /** Поле, на котором ставится фокус: `alignment` или ключ приметы. */
    focusField?: string | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  const alignment = ref('');

  const traits = ref<Pick<SheetPersonality, TraitKey>>({
    age: '',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
  });

  watch(isOpen, (open) => {
    if (!open) {
      return;
    }

    const { personality } = document.value;

    alignment.value = document.value.alignment;

    traits.value = {
      age: personality.age,
      height: personality.height,
      weight: personality.weight,
      eyes: personality.eyes,
      hair: personality.hair,
      skin: personality.skin,
    };
  });

  /** Мировоззрения; своё значение листа остаётся в списке. */
  const alignmentItems = computed(() =>
    [...new Set<string>([...ALIGNMENTS, alignment.value])].filter(Boolean),
  );

  /**
   * Мировоззрение из списка или своё.
   * @param value - выбранное или вписанное значение
   */
  function setAlignment(value: unknown): void {
    alignment.value = typeof value === 'string' ? value : '';
  }

  /**
   * Краткая примета.
   * @param key - примета
   * @param value - значение
   */
  function setTrait(key: TraitKey, value: string | number): void {
    traits.value = { ...traits.value, [key]: String(value) };
  }

  function reset(): void {
    alignment.value = '';

    traits.value = {
      age: '',
      height: '',
      weight: '',
      eyes: '',
      hair: '',
      skin: '',
    };
  }

  function apply(): void {
    const nextAlignment = alignment.value.trim();

    const nextTraits: Pick<SheetPersonality, TraitKey> = {
      age: traits.value.age.trim(),
      height: traits.value.height.trim(),
      weight: traits.value.weight.trim(),
      eyes: traits.value.eyes.trim(),
      hair: traits.value.hair.trim(),
      skin: traits.value.skin.trim(),
    };

    update((current) => ({
      ...current,
      alignment: nextAlignment,
      personality: { ...current.personality, ...nextTraits },
    }));

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="PERSONALITY_TEXT.modalTitle"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="grid grid-cols-2 gap-3">
        <UFormField
          :label="SHEET_LABELS.alignment"
          class="col-span-2"
        >
          <USelectMenu
            :model-value="alignment"
            :items="alignmentItems"
            :placeholder="PERSONALITY_TEXT.alignmentPlaceholder"
            create-item
            class="w-full"
            :autofocus="focusField === 'alignment'"
            @update:model-value="setAlignment"
            @create="setAlignment"
          />
        </UFormField>

        <UFormField
          v-for="field in PERSONALITY_TRAIT_FIELDS"
          :key="field.key"
          :label="field.label"
        >
          <UInput
            :model-value="traits[field.key]"
            :placeholder="field.placeholder"
            :maxlength="PERSONALITY_TRAIT_MAX_LENGTH"
            :autofocus="focusField === field.key"
            class="w-full"
            @update:model-value="setTrait(field.key, $event)"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          :label="PERSONALITY_TEXT.reset"
          color="neutral"
          variant="link"
          class="mr-auto"
          @click.left.exact.prevent="reset"
        />

        <UButton
          :label="PERSONALITY_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="PERSONALITY_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
