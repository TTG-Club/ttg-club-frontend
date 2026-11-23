<script setup lang="ts">
  import type { AbilityKey, SheetAttunement } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    ATTUNEMENT_TEXT,
    getAbilityModifier,
    getAttunementBreakdown,
  } from '../model';

  /**
   * Предел настройки, как на new.ttg.club: основа — правило «три предмета»
   * или модификатор характеристики, бонус или своё число, и список
   * настроенных предметов. Превышение предела подсвечивается.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  /** Пункт «правило: три предмета» в выборе основы. */
  const BASE_RULE = 'RULE';

  const draft = ref<SheetAttunement>({ ...document.value.attunement });

  watch(isOpen, (open) => {
    if (open) {
      draft.value = { ...document.value.attunement };
    }
  });

  const baseItems = [
    { label: ATTUNEMENT_TEXT.baseRule, value: BASE_RULE },
    ...ABILITY_KEYS.map((key) => ({
      label: `${ATTUNEMENT_TEXT.baseAbility}: ${ABILITY_LABELS[key].name}`,
      value: key,
    })),
  ];

  const baseValue = computed(() => draft.value.ability ?? BASE_RULE);

  const breakdown = computed(() =>
    getAttunementBreakdown({ attunement: draft.value }, (ability) =>
      getAbilityModifier(stats.value.abilities[ability]),
    ),
  );

  const attunedItems = computed(() =>
    document.value.inventory.filter((item) => item.isAttuned),
  );

  const countClass = computed(() =>
    attunedItems.value.length > breakdown.value.value
      ? 'text-error'
      : 'text-highlighted',
  );

  /**
   * Основа предела.
   * @param value - выбранный пункт
   */
  function setBase(value: unknown): void {
    const ability: AbilityKey | undefined = ABILITY_KEYS.find(
      (key) => key === value,
    );

    draft.value = { ...draft.value, ability: ability ?? null };
  }

  /**
   * Своё число; пустое поле возвращает расчёт.
   * @param value - предел
   */
  function setCustom(value: number | null): void {
    draft.value = {
      ...draft.value,
      custom: value === null ? null : Math.max(0, Math.trunc(value)),
    };
  }

  /**
   * Бонус к пределу.
   * @param value - бонус
   */
  function setBonus(value: number | null): void {
    draft.value = { ...draft.value, bonus: Math.trunc(value ?? 0) };
  }

  function apply(): void {
    const attunement = { ...draft.value };

    update((current) => ({ ...current, attunement }));
    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ATTUNEMENT_TEXT.settings"
    :description="ATTUNEMENT_TEXT.description"
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
              {{ ATTUNEMENT_TEXT.attunedNow }}
            </span>

            <span
              class="text-2xl leading-none font-bold"
              :class="countClass"
            >
              {{ attunedItems.length }}
            </span>
          </div>

          <div
            class="flex flex-col gap-1 rounded-lg border border-primary/40 bg-primary/10 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ ATTUNEMENT_TEXT.total }}
            </span>

            <span class="text-2xl leading-none font-bold text-primary">
              {{ breakdown.value }}
            </span>
          </div>
        </div>

        <UFormField :label="ATTUNEMENT_TEXT.base">
          <USelect
            :model-value="baseValue"
            :items="baseItems"
            class="w-full"
            @update:model-value="setBase"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-2">
          <UFormField :label="ATTUNEMENT_TEXT.bonus">
            <UInputNumber
              :model-value="draft.bonus"
              :disabled="draft.custom !== null"
              class="w-full"
              @update:model-value="setBonus"
            />
          </UFormField>

          <UFormField
            :label="ATTUNEMENT_TEXT.custom"
            :help="ATTUNEMENT_TEXT.customHint"
          >
            <UInputNumber
              :model-value="draft.custom ?? undefined"
              :min="0"
              class="w-full"
              @update:model-value="setCustom"
            />
          </UFormField>
        </div>

        <USeparator />

        <div class="flex flex-col gap-1.5">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ ATTUNEMENT_TEXT.itemsTitle }}
          </span>

          <span
            v-for="item in attunedItems"
            :key="item.id"
            class="flex items-center gap-2 text-sm text-toned"
          >
            <UIcon
              name="tabler:link"
              class="size-4 text-primary"
            />

            {{ item.name }}
          </span>

          <span
            v-if="!attunedItems.length"
            class="text-xs text-dimmed italic"
          >
            {{ ATTUNEMENT_TEXT.noItems }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ATTUNEMENT_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="ATTUNEMENT_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
