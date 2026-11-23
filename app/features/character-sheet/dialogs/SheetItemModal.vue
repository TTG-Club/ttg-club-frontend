<script setup lang="ts">
  import type {
    ArmorCategory,
    SheetArmor,
    SheetItem,
    SheetWeapon,
  } from '../model';

  import {
    ARMOR_CATEGORIES,
    ARMOR_CATEGORY_LABELS,
    ATTUNEMENT_TEXT,
    RECHARGE_EVENT_LABELS,
    RECHARGE_EVENTS,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';

  /**
   * Правка предмета снаряжения: название, количество, вес, заметки, а у
   * оружия и доспеха — их боевые свойства. Правки применяются кнопкой.
   */
  const { item } = defineProps<{
    item: SheetItem | null;
  }>();

  const emit = defineEmits<{
    save: [item: SheetItem];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const draft = ref<SheetItem | null>(null);

  const armorCategoryOptions = ARMOR_CATEGORIES.map((category) => ({
    label: ARMOR_CATEGORY_LABELS[category],
    value: category,
  }));

  const emptyWeapon: SheetWeapon = {
    damage: '',
    damageType: '',
    isRanged: false,
    isFinesse: false,
    isProficient: true,
    bonus: 0,
    isMartial: false,
    isHeavy: false,
    versatileDamage: '',
    extraDamage: '',
    extraDamageType: '',
  };

  const emptyArmor: SheetArmor = {
    category: 'LIGHT',
    baseArmorClass: 11,
    strengthRequirement: null,
    stealthDisadvantage: false,
    bonus: 0,
  };

  watch(
    () => [isOpen.value, item] as const,
    ([open, source]) => {
      if (open && source) {
        draft.value = { ...source };
      }
    },
    { immediate: true },
  );

  /**
   * Меняет поле черновика.
   * @param patch - изменённые поля
   */
  function patchDraft(patch: Partial<SheetItem>): void {
    if (draft.value) {
      draft.value = { ...draft.value, ...patch };
    }
  }

  /**
   * Меняет боевые свойства оружия.
   * @param patch - изменённые поля
   */
  function patchWeapon(patch: Partial<SheetWeapon>): void {
    patchDraft({
      weapon: { ...(draft.value?.weapon ?? emptyWeapon), ...patch },
    });
  }

  /**
   * Меняет свойства доспеха.
   * @param patch - изменённые поля
   */
  function patchArmor(patch: Partial<SheetArmor>): void {
    patchDraft({ armor: { ...(draft.value?.armor ?? emptyArmor), ...patch } });
  }

  /**
   * Включает или убирает у предмета свойства оружия.
   * @param isWeapon - предмет — оружие
   */
  function setIsWeapon(isWeapon: boolean | 'indeterminate'): void {
    patchDraft({ weapon: isWeapon === true ? emptyWeapon : null });
  }

  /**
   * Включает или убирает у предмета свойства доспеха.
   * @param isArmor - предмет — доспех
   */
  function setIsArmor(isArmor: boolean | 'indeterminate'): void {
    patchDraft({ armor: isArmor === true ? emptyArmor : null });
  }

  /**
   * Категория доспеха из списка.
   * @param value - выбранное значение
   */
  function setArmorCategory(value: ArmorCategory): void {
    patchArmor({ category: value });
  }

  const rechargeOptions = Object.entries(RECHARGE_EVENT_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  /**
   * Требует ли предмет настройки.
   * @param value - отметка
   */
  function setRequiresAttunement(value: boolean | 'indeterminate'): void {
    patchDraft({ requiresAttunement: value === true });
  }

  /**
   * Максимум зарядов; ноль — зарядов нет.
   * @param value - максимум
   */
  function setChargesMax(value: number | null): void {
    const max = Math.max(0, value ?? 0);
    const charges = draft.value?.charges;

    patchDraft({
      charges: max
        ? {
            max,
            used: Math.min(charges?.used ?? 0, max),
            recharge: charges?.recharge ?? '',
            rechargeEvent: charges?.rechargeEvent ?? RECHARGE_EVENTS.dawn,
          }
        : null,
    });
  }

  /**
   * Формула восстановления зарядов.
   * @param value - формула
   */
  function setRecharge(value: string | number): void {
    const charges = draft.value?.charges;

    if (charges) {
      patchDraft({ charges: { ...charges, recharge: String(value) } });
    }
  }

  /**
   * Когда восстанавливаются заряды.
   * @param value - событие восстановления
   */
  function setRechargeEvent(value: string): void {
    const charges = draft.value?.charges;

    if (charges) {
      patchDraft({ charges: { ...charges, rechargeEvent: value } });
    }
  }

  function save(): void {
    if (draft.value) {
      emit('save', {
        ...draft.value,
        name: draft.value.name.trim() || SHEET_LABELS.item,
      });
    }

    isOpen.value = false;
  }

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_LABELS.item"
    :ui="{
      content: 'max-w-lg',
      body: 'flex flex-col gap-3',
      footer: 'justify-end',
    }"
  >
    <template #body>
      <template v-if="draft">
        <UFormField :label="SHEET_LABELS.name">
          <UInput
            :model-value="draft.name"
            class="w-full"
            @update:model-value="patchDraft({ name: String($event) })"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-2">
          <UFormField :label="SHEET_LABELS.quantity">
            <UInputNumber
              :model-value="draft.quantity"
              :min="0"
              class="w-full"
              @update:model-value="patchDraft({ quantity: $event ?? 0 })"
            />
          </UFormField>

          <UFormField
            :label="`${SHEET_LABELS.weight}, ${SHEET_LABELS.weightUnit}`"
          >
            <UInputNumber
              :model-value="draft.weight"
              :min="0"
              :step="0.25"
              class="w-full"
              @update:model-value="patchDraft({ weight: $event ?? 0 })"
            />
          </UFormField>
        </div>

        <div class="flex gap-4">
          <UCheckbox
            :model-value="Boolean(draft.weapon)"
            :label="SHEET_LABELS.weapon"
            @update:model-value="setIsWeapon"
          />

          <UCheckbox
            :model-value="Boolean(draft.armor)"
            :label="SHEET_LABELS.armor"
            @update:model-value="setIsArmor"
          />
        </div>

        <div
          v-if="draft.weapon"
          class="grid grid-cols-2 gap-2 rounded-lg border border-default p-3"
        >
          <UFormField :label="SHEET_LABELS.damageDice">
            <UInput
              :model-value="draft.weapon.damage"
              :placeholder="SHEET_LABELS.damagePlaceholder"
              class="w-full"
              @update:model-value="patchWeapon({ damage: String($event) })"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.damageType">
            <UInput
              :model-value="draft.weapon.damageType"
              class="w-full"
              @update:model-value="patchWeapon({ damageType: String($event) })"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.magicBonus">
            <UInputNumber
              :model-value="draft.weapon.bonus"
              class="w-full"
              @update:model-value="patchWeapon({ bonus: $event ?? 0 })"
            />
          </UFormField>

          <div class="flex flex-col justify-end gap-1">
            <UCheckbox
              :model-value="draft.weapon.isProficient"
              :label="SHEET_LABELS.proficient"
              @update:model-value="
                patchWeapon({ isProficient: $event === true })
              "
            />

            <UCheckbox
              :model-value="draft.weapon.isFinesse"
              :label="SHEET_LABELS.finesse"
              @update:model-value="patchWeapon({ isFinesse: $event === true })"
            />

            <UCheckbox
              :model-value="draft.weapon.isRanged"
              :label="SHEET_LABELS.ranged"
              @update:model-value="patchWeapon({ isRanged: $event === true })"
            />
          </div>
        </div>

        <div
          v-if="draft.armor"
          class="grid grid-cols-2 gap-2 rounded-lg border border-default p-3"
        >
          <UFormField :label="SHEET_LABELS.armorCategory">
            <USelect
              :model-value="draft.armor.category"
              :items="armorCategoryOptions"
              class="w-full"
              @update:model-value="setArmorCategory"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.baseArmorClass">
            <UInputNumber
              :model-value="draft.armor.baseArmorClass"
              :min="0"
              class="w-full"
              @update:model-value="patchArmor({ baseArmorClass: $event ?? 0 })"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.magicBonus">
            <UInputNumber
              :model-value="draft.armor.bonus"
              class="w-full"
              @update:model-value="patchArmor({ bonus: $event ?? 0 })"
            />
          </UFormField>

          <UCheckbox
            :model-value="draft.armor.stealthDisadvantage"
            :label="SHEET_LABELS.stealthDisadvantage"
            class="self-end"
            @update:model-value="
              patchArmor({ stealthDisadvantage: $event === true })
            "
          />
        </div>

        <div class="grid grid-cols-2 items-end gap-3">
          <UCheckbox
            :model-value="draft.requiresAttunement"
            :label="ATTUNEMENT_TEXT.requires"
            @update:model-value="setRequiresAttunement"
          />

          <UFormField :label="ATTUNEMENT_TEXT.charges">
            <UInputNumber
              :model-value="draft.charges?.max ?? 0"
              :min="0"
              class="w-full"
              @update:model-value="setChargesMax"
            />
          </UFormField>

          <UFormField
            v-if="draft.charges"
            :label="ATTUNEMENT_TEXT.recharge"
            class="col-span-2"
          >
            <div class="flex gap-2">
              <UInput
                :model-value="draft.charges.recharge"
                placeholder="1к6+1"
                class="flex-1"
                @update:model-value="setRecharge"
              />

              <USelect
                :model-value="draft.charges.rechargeEvent"
                :items="rechargeOptions"
                class="w-56"
                @update:model-value="setRechargeEvent"
              />
            </div>
          </UFormField>
        </div>

        <UFormField :label="SHEET_LABELS.notes">
          <UTextarea
            :model-value="draft.notes"
            :rows="2"
            autoresize
            class="w-full"
            @update:model-value="patchDraft({ notes: String($event) })"
          />
        </UFormField>
      </template>
    </template>

    <template #footer>
      <UButton
        :label="SHEET_LABELS.close"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="close"
      />

      <UButton
        :label="SHEET_LABELS.save"
        :icon="SHEET_ICON.check"
        @click.left.exact.prevent="save"
      />
    </template>
  </UModal>
</template>
