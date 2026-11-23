<script setup lang="ts">
  import type { CurrencyKey, CustomCurrency, SheetCurrency } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    createSheetElementId,
    CURRENCY_KEYS,
    CURRENCY_TEXT,
    CURRENCY_TITLES,
    getCoinWeight,
    getCurrencyInGold,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';

  /**
   * Монеты, как на new.ttg.club: пять монет, свои валюты (название,
   * сокращение, количество), пересчёт в золото и вес монет. Правки
   * применяются кнопкой.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  const coins = ref<SheetCurrency>({ ...document.value.currency });
  const customs = ref<Array<CustomCurrency>>([]);

  watch(isOpen, (open) => {
    if (open) {
      coins.value = { ...document.value.currency };

      customs.value = document.value.customCurrencies.map((entry) => ({
        ...entry,
      }));
    }
  });

  const summary = computed(
    () =>
      `${CURRENCY_TEXT.total}: ${getCurrencyInGold(coins.value)} · ${SHEET_LABELS.weight}: ${getCoinWeight(coins.value)} ${SHEET_LABELS.weightUnit}`,
  );

  /**
   * Количество монет.
   * @param key - вид монет
   * @param value - количество
   */
  function setCoin(key: CurrencyKey, value: number | null): void {
    coins.value = {
      ...coins.value,
      [key]: Math.max(0, Math.trunc(value ?? 0)),
    };
  }

  /**
   * Меняет свою валюту.
   * @param id - валюта
   * @param patch - изменённые поля
   */
  function patchCustom(id: string, patch: Partial<CustomCurrency>): void {
    customs.value = customs.value.map((entry) =>
      entry.id === id ? { ...entry, ...patch } : entry,
    );
  }

  /**
   * Название своей валюты.
   * @param id - валюта
   * @param value - название
   */
  function setCustomName(id: string, value: string | number): void {
    patchCustom(id, { name: String(value) });
  }

  /**
   * Сокращение своей валюты.
   * @param id - валюта
   * @param value - сокращение
   */
  function setCustomShort(id: string, value: string | number): void {
    patchCustom(id, { short: String(value) });
  }

  /**
   * Количество своей валюты.
   * @param id - валюта
   * @param value - количество
   */
  function setCustomAmount(id: string, value: number | null): void {
    patchCustom(id, { amount: Math.max(0, Math.trunc(value ?? 0)) });
  }

  function addCustom(): void {
    customs.value = [
      ...customs.value,
      { id: createSheetElementId(), name: '', short: '', amount: 0 },
    ];
  }

  /**
   * Убирает свою валюту.
   * @param id - валюта
   */
  function removeCustom(id: string): void {
    customs.value = customs.value.filter((entry) => entry.id !== id);
  }

  function apply(): void {
    const currency = { ...coins.value };

    const customCurrencies = customs.value.filter((entry) => entry.name.trim());

    update((current) => ({ ...current, currency, customCurrencies }));
    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="CURRENCY_TEXT.title"
    :description="CURRENCY_TEXT.description"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <UFormField
            v-for="key in CURRENCY_KEYS"
            :key="key"
            :label="CURRENCY_TITLES[key]"
          >
            <UInputNumber
              :model-value="coins[key]"
              :min="0"
              class="w-full"
              @update:model-value="setCoin(key, $event)"
            />
          </UFormField>
        </div>

        <p class="text-xs text-dimmed">{{ summary }}</p>

        <USeparator />

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ CURRENCY_TEXT.custom }}
            </span>

            <UButton
              :icon="SHEET_ICON.add"
              :label="CURRENCY_TEXT.add"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="addCustom"
            />
          </div>

          <div
            v-for="entry in customs"
            :key="entry.id"
            class="flex items-end gap-2"
          >
            <UFormField
              :label="CURRENCY_TEXT.name"
              class="min-w-0 grow"
            >
              <UInput
                :model-value="entry.name"
                :placeholder="CURRENCY_TEXT.namePlaceholder"
                size="sm"
                class="w-full"
                @update:model-value="setCustomName(entry.id, $event)"
              />
            </UFormField>

            <UFormField
              :label="CURRENCY_TEXT.short"
              class="w-16 shrink-0"
            >
              <UInput
                :model-value="entry.short"
                size="sm"
                class="w-full"
                @update:model-value="setCustomShort(entry.id, $event)"
              />
            </UFormField>

            <UFormField
              :label="CURRENCY_TEXT.amount"
              class="w-28 shrink-0"
            >
              <UInputNumber
                :model-value="entry.amount"
                :min="0"
                size="sm"
                @update:model-value="setCustomAmount(entry.id, $event)"
              />
            </UFormField>

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="SHEET_LABELS.remove"
              color="error"
              variant="ghost"
              size="sm"
              @click.left.exact.prevent="removeCustom(entry.id)"
            />
          </div>

          <p class="text-xs text-dimmed">{{ CURRENCY_TEXT.customHint }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="CURRENCY_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="CURRENCY_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
