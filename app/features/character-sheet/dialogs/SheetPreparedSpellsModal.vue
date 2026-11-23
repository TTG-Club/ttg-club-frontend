<script setup lang="ts">
  import type { PreparedKind } from '../model';

  import { useCharacterSheet, useSheetSpellcasting } from '../composables';
  import { PREPARED_TEXT } from '../model';

  /**
   * Предел подготовленных заклинаний или известных заговоров, как на
   * new.ttg.club: число по таблице класса, своё число вместо него и бонус
   * сверху; итог считается на лету.
   */
  const { kind } = defineProps<{
    kind: PreparedKind;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { update } = useCharacterSheet();
  const { spellsLimit, cantripsLimit } = useSheetSpellcasting();

  const breakdown = computed(() =>
    kind === 'cantrips' ? cantripsLimit.value : spellsLimit.value,
  );

  const isCustom = ref(false);
  const customValue = ref(0);
  const bonus = ref(0);

  watch(isOpen, (open) => {
    if (open) {
      const saved = breakdown.value;

      isCustom.value = saved.custom !== null;
      customValue.value = saved.custom ?? saved.classValue ?? 0;
      bonus.value = saved.bonus;
    }
  });

  const title = computed(() =>
    kind === 'cantrips'
      ? PREPARED_TEXT.cantripsTitle
      : PREPARED_TEXT.spellsTitle,
  );

  const classValueLabel = computed(() =>
    breakdown.value.classValue === null
      ? PREPARED_TEXT.noClassValue
      : String(breakdown.value.classValue),
  );

  const total = computed(() => {
    const base = isCustom.value
      ? customValue.value
      : breakdown.value.classValue;

    return base === null ? '—' : String(Math.max(0, base + bonus.value));
  });

  /**
   * Своё число вместо таблицы класса.
   * @param value - включено ли
   */
  function setCustom(value: boolean | 'indeterminate'): void {
    isCustom.value = value === true;
  }

  /**
   * Своё число.
   * @param value - число
   */
  function setCustomValue(value: number | null): void {
    customValue.value = Math.max(0, Math.trunc(value ?? 0));
  }

  /**
   * Бонус к пределу.
   * @param value - бонус
   */
  function setBonus(value: number | null): void {
    bonus.value = Math.trunc(value ?? 0);
  }

  function apply(): void {
    const custom = isCustom.value ? customValue.value : null;
    const nextBonus = bonus.value;

    update((current) =>
      kind === 'cantrips'
        ? {
            ...current,
            cantripsLimitOverride: custom,
            cantripsBonus: nextBonus,
          }
        : {
            ...current,
            preparedLimitOverride: custom,
            preparedBonus: nextBonus,
          },
    );

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
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-2">
          <div
            class="flex flex-col gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ PREPARED_TEXT.classValue }}
            </span>

            <span class="text-sm font-bold text-highlighted">
              {{ classValueLabel }}
            </span>
          </div>

          <div
            class="flex flex-col gap-1 rounded-lg border border-primary/40 bg-primary/10 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ PREPARED_TEXT.total }}
            </span>

            <span class="text-2xl leading-none font-bold text-primary">
              {{ total }}
            </span>
          </div>
        </div>

        <USwitch
          :model-value="isCustom"
          :label="PREPARED_TEXT.custom"
          @update:model-value="setCustom"
        />

        <div class="grid grid-cols-2 gap-2">
          <UFormField :label="PREPARED_TEXT.override">
            <UInputNumber
              :model-value="customValue"
              :min="0"
              :disabled="!isCustom"
              class="w-full"
              @update:model-value="setCustomValue"
            />
          </UFormField>

          <UFormField :label="PREPARED_TEXT.bonus">
            <UInputNumber
              :model-value="bonus"
              class="w-full"
              @update:model-value="setBonus"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="PREPARED_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="PREPARED_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
