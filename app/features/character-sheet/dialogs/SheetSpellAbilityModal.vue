<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import { useCharacterSheet } from '../composables';
  import { ABILITY_KEYS, ABILITY_LABELS, SPELL_ABILITY_TEXT } from '../model';

  /**
   * Своя характеристика заклинания: черта или вид считают заклинание от
   * своей характеристики, а не от класса.
   */
  const { spellId } = defineProps<{
    spellId: string | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  /** Пункт «Как у класса». */
  const INHERIT = 'INHERIT';

  const draft = ref<AbilityKey | null>(null);

  const spell = computed(
    () => document.value.spells.find((entry) => entry.id === spellId) ?? null,
  );

  watch(isOpen, (open) => {
    if (open) {
      draft.value = spell.value?.spellcastingAbility ?? null;
    }
  });

  const items = [
    { label: SPELL_ABILITY_TEXT.inherit, value: INHERIT },
    ...ABILITY_KEYS.map((key) => ({
      label: ABILITY_LABELS[key].name,
      value: key,
    })),
  ];

  const title = computed(() =>
    spell.value
      ? `${SPELL_ABILITY_TEXT.title}: ${spell.value.name}`
      : SPELL_ABILITY_TEXT.title,
  );

  /**
   * Выбор характеристики.
   * @param value - пункт списка
   */
  function setAbility(value: unknown): void {
    draft.value = ABILITY_KEYS.find((key) => key === value) ?? null;
  }

  function apply(): void {
    const ability = draft.value;

    update((current) => ({
      ...current,
      spells: current.spells.map((entry) =>
        entry.id === spellId
          ? { ...entry, spellcastingAbility: ability }
          : entry,
      ),
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
    :title="title"
    :description="SPELL_ABILITY_TEXT.hint"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UFormField :label="SPELL_ABILITY_TEXT.label">
        <USelect
          :model-value="draft ?? INHERIT"
          :items="items"
          class="w-full"
          @update:model-value="setAbility"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SPELL_ABILITY_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SPELL_ABILITY_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
