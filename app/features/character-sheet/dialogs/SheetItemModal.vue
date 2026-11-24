<script setup lang="ts">
  import type {
    ArmorCategory,
    ItemKind,
    SheetArmor,
    SheetItem,
    SheetWeapon,
  } from '../model';

  import { clamp } from 'es-toolkit';

  import { useCharacterSheet } from '../composables';
  import {
    ARMOR_CATEGORIES,
    ARMOR_CATEGORY_LABELS,
    ATTUNEMENT_TEXT,
    DAMAGE_DICE_COUNT,
    DAMAGE_DIE_FACES,
    formatDice,
    formatModifier,
    getItemKind,
    isWeaponProficient,
    ITEM_FORM_TEXT,
    ITEM_KIND_LABELS,
    ITEM_KINDS,
    parseDice,
    RECHARGE_EVENT_LABELS,
    RECHARGE_EVENTS,
    SHEET_ICON,
    SHEET_LABELS,
    sheetArmorSchema,
    sheetWeaponSchema,
    WEAPON_DAMAGE_TYPES,
    WEAPON_PROFICIENCY_NO,
    WEAPON_PROFICIENCY_OVERRIDES,
    WEAPON_PROFICIENCY_YES,
  } from '../model';

  /**
   * Правка предмета, как окно своего предмета на new.ttg.club. «Основное»:
   * вид, название, количество, цена, вес, у оружия — категория, свойства,
   * кости и тип урона, вторая кость двуручного хвата, у доспеха — категория,
   * КД, Сила и Скрытность; описание и заметки. «Магия»: бонус, доп. урон,
   * настройка, включение, заряды и сводка. Предмет справочника правится
   * частично: его свойства приходят из справочника.
   */
  const { item } = defineProps<{
    item: SheetItem | null;
  }>();

  const emit = defineEmits<{
    save: [item: SheetItem];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document } = useCharacterSheet();

  /** Пункт «нет» у второй кости и доп. урона. */
  const NONE = 0;

  const draft = ref<SheetItem | null>(null);

  watch(
    () => [isOpen.value, item] as const,
    ([open, source]) => {
      if (open && source) {
        draft.value = { ...source };
      }
    },
    { immediate: true },
  );

  const isCustom = computed(() => !draft.value?.url);

  const title = computed(() =>
    isCustom.value ? ITEM_FORM_TEXT.customTitle : ITEM_FORM_TEXT.title,
  );

  const tabs = [
    { label: ITEM_FORM_TEXT.tabMain, value: 'main', slot: 'main' },
    { label: ITEM_FORM_TEXT.tabMagic, value: 'magic', slot: 'magic' },
  ];

  const kindItems = ITEM_KINDS.map((kind) => ({
    label: ITEM_KIND_LABELS[kind],
    value: kind,
  }));

  const kind = computed(() =>
    draft.value ? getItemKind(draft.value) : 'other',
  );

  const armorCategoryItems = ARMOR_CATEGORIES.map((category) => ({
    label: ARMOR_CATEGORY_LABELS[category],
    value: category,
  }));

  const categoryItems = [
    { label: ITEM_FORM_TEXT.simple, value: 'simple' },
    { label: ITEM_FORM_TEXT.martial, value: 'martial' },
  ];

  const faceItems = DAMAGE_DIE_FACES.map(
    (faces): { label: string; value: number } => ({
      label: formatDice(1, faces).slice(1),
      value: faces,
    }),
  );

  const optionalFaceItems = [
    { label: ITEM_FORM_TEXT.versatileNone, value: NONE },
    ...faceItems,
  ];

  const rechargeItems = Object.entries(RECHARGE_EVENT_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  /** Типы урона; чужой тип из справочника остаётся в списке. */
  const damageTypeItems = computed(() => {
    const current = [
      draft.value?.weapon?.damageType,
      draft.value?.weapon?.extraDamageType,
    ].filter((type): type is string => Boolean(type));

    return [...new Set([...WEAPON_DAMAGE_TYPES, ...current])].map((type) => ({
      label: type,
      value: type,
    }));
  });

  const damageDice = computed(
    () =>
      parseDice(draft.value?.weapon?.damage ?? '') ?? { count: 1, faces: 6 },
  );

  const versatileFaces = computed(
    () => parseDice(draft.value?.weapon?.versatileDamage ?? '')?.faces ?? NONE,
  );

  const extraDice = computed(() =>
    parseDice(draft.value?.weapon?.extraDamage ?? ''),
  );

  const extraFaces = computed(() => extraDice.value?.faces ?? NONE);

  const weaponCategory = computed(() =>
    draft.value?.weapon?.isMartial ? 'martial' : 'simple',
  );

  /** Сводка «что даёт предмет». */
  const summary = computed(() => {
    const value = draft.value;

    if (!value) {
      return [];
    }

    const { weapon, armor, charges } = value;

    return [
      weapon?.bonus
        ? `${formatModifier(weapon.bonus)} ${ITEM_FORM_TEXT.bonusAttack}`
        : '',
      armor?.bonus
        ? `${formatModifier(armor.bonus)} ${ITEM_FORM_TEXT.bonusArmor}`
        : '',
      weapon?.extraDamage
        ? `+${weapon.extraDamage} ${weapon.extraDamageType}`.trim()
        : '',
      value.requiresAttunement ? ATTUNEMENT_TEXT.requires : '',
      value.activatable ? ITEM_FORM_TEXT.activatable : '',
      charges
        ? `${ITEM_FORM_TEXT.charges}: ${charges.max}${charges.recharge ? ` (${charges.recharge})` : ''}`
        : '',
      value.activeEffects.length
        ? `${ITEM_FORM_TEXT.effects}: ${value.activeEffects.length}`
        : '',
      value.passive,
    ].filter(Boolean);
  });

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
   * Меняет свойства оружия.
   * @param patch - изменённые поля
   */
  function patchWeapon(patch: Partial<SheetWeapon>): void {
    patchDraft({
      weapon: {
        ...(draft.value?.weapon ?? sheetWeaponSchema.parse({})),
        ...patch,
      },
    });
  }

  /**
   * Меняет свойства доспеха.
   * @param patch - изменённые поля
   */
  function patchArmor(patch: Partial<SheetArmor>): void {
    patchDraft({
      armor: {
        ...(draft.value?.armor
          ?? sheetArmorSchema.parse({ category: 'LIGHT', baseArmorClass: 11 })),
        ...patch,
      },
    });
  }

  /**
   * Вид предмета: оружие и доспех получают свои свойства.
   * @param value - выбранный вид
   */
  function setKind(value: unknown): void {
    const next: ItemKind | undefined = ITEM_KINDS.find((key) => key === value);

    if (!next) {
      return;
    }

    patchDraft({
      weapon:
        next === 'weapon'
          ? (draft.value?.weapon ?? sheetWeaponSchema.parse({ damage: '1к6' }))
          : null,
      armor:
        next === 'armor'
          ? (draft.value?.armor
            ?? sheetArmorSchema.parse({
              category: 'LIGHT',
              baseArmorClass: 11,
            }))
          : null,
    });
  }

  /**
   * Название.
   * @param value - текст
   */
  function setName(value: string | number): void {
    patchDraft({ name: String(value) });
  }

  /**
   * Количество.
   * @param value - число
   */
  function setQuantity(value: number | null): void {
    patchDraft({ quantity: Math.max(0, Math.trunc(value ?? 0)) });
  }

  /**
   * Вес штуки.
   * @param value - фунты
   */
  function setWeight(value: number | null): void {
    patchDraft({ weight: Math.max(0, value ?? 0) });
  }

  /**
   * Цена.
   * @param value - текст
   */
  function setCost(value: string | number): void {
    patchDraft({ cost: String(value) });
  }

  /**
   * Описание.
   * @param value - текст
   */
  function setDescription(value: string | number): void {
    patchDraft({ description: String(value) });
  }

  /**
   * Заметки.
   * @param value - текст
   */
  function setNotes(value: string | number): void {
    patchDraft({ notes: String(value) });
  }

  /**
   * Категория оружия.
   * @param value - простое или воинское
   */
  function setWeaponCategory(value: unknown): void {
    patchWeapon({ isMartial: value === 'martial' });
  }

  /** Пункт «по листу» у владения оружием. */
  const PROFICIENCY_AUTO = 'auto';

  const weaponProficiencyItems = [
    { label: ITEM_FORM_TEXT.proficiencyAuto, value: PROFICIENCY_AUTO },
    { label: ITEM_FORM_TEXT.proficiencyYes, value: WEAPON_PROFICIENCY_YES },
    { label: ITEM_FORM_TEXT.proficiencyNo, value: WEAPON_PROFICIENCY_NO },
  ];

  const weaponProficiency = computed(
    () => draft.value?.weapon?.proficiency ?? PROFICIENCY_AUTO,
  );

  /** Что выходит по владениям листа, пока отметка не задана вручную. */
  const weaponProficiencyHint = computed(() => {
    const current = draft.value;

    if (!current?.weapon || current.weapon.proficiency) {
      return undefined;
    }

    return isWeaponProficient(document.value, current)
      ? ITEM_FORM_TEXT.proficiencyAutoYes
      : ITEM_FORM_TEXT.proficiencyAutoNo;
  });

  /**
   * Ручное владение оружием.
   * @param value - пункт списка
   */
  function setWeaponProficiency(value: unknown): void {
    const proficiency = WEAPON_PROFICIENCY_OVERRIDES.find(
      (override) => override === value,
    );

    patchWeapon({ proficiency: proficiency ?? null });
  }

  /**
   * Флажок свойства оружия.
   * @param field - свойство
   * @param value - отметка
   */
  function setWeaponFlag(
    field: 'isFinesse' | 'isRanged' | 'isHeavy',
    value: boolean | 'indeterminate',
  ): void {
    patchWeapon({ [field]: value === true });
  }

  /**
   * Сколько костей урона.
   * @param value - число
   */
  function setDiceCount(value: number | null): void {
    const count = clamp(
      Math.trunc(value ?? DAMAGE_DICE_COUNT.min),
      DAMAGE_DICE_COUNT.min,
      DAMAGE_DICE_COUNT.max,
    );

    patchWeapon({ damage: formatDice(count, damageDice.value.faces) });
  }

  /**
   * Кость урона.
   * @param value - грани
   */
  function setDiceFaces(value: unknown): void {
    const faces = DAMAGE_DIE_FACES.find((item) => item === value);

    if (faces) {
      patchWeapon({ damage: formatDice(damageDice.value.count, faces) });
    }
  }

  /**
   * Вторая кость двуручного хвата; «нет» убирает свойство.
   * @param value - грани
   */
  function setVersatile(value: unknown): void {
    const faces = DAMAGE_DIE_FACES.find((item) => item === value);

    patchWeapon({
      versatileDamage: faces ? formatDice(damageDice.value.count, faces) : '',
    });
  }

  /**
   * Тип урона.
   * @param value - тип
   */
  function setDamageType(value: unknown): void {
    patchWeapon({ damageType: String(value ?? '') });
  }

  /**
   * Кость дополнительного урона; «нет» убирает его.
   * @param value - грани
   */
  function setExtraFaces(value: unknown): void {
    const faces = DAMAGE_DIE_FACES.find((item) => item === value);

    patchWeapon({
      extraDamage: faces ? formatDice(extraDice.value?.count ?? 1, faces) : '',
    });
  }

  /**
   * Сколько костей дополнительного урона.
   * @param value - число
   */
  function setExtraCount(value: number | null): void {
    const faces = extraDice.value?.faces;

    if (faces) {
      patchWeapon({
        extraDamage: formatDice(
          clamp(
            Math.trunc(value ?? 1),
            DAMAGE_DICE_COUNT.min,
            DAMAGE_DICE_COUNT.max,
          ),
          faces,
        ),
      });
    }
  }

  /**
   * Тип дополнительного урона.
   * @param value - тип
   */
  function setExtraType(value: unknown): void {
    patchWeapon({ extraDamageType: String(value ?? '') });
  }

  /**
   * Магический бонус оружия или доспеха.
   * @param value - бонус
   */
  function setMagicBonus(value: number | null): void {
    const bonus = Math.trunc(value ?? 0);

    if (draft.value?.weapon) {
      patchWeapon({ bonus });
    }

    if (draft.value?.armor) {
      patchArmor({ bonus });
    }
  }

  /**
   * Категория доспеха.
   * @param value - категория
   */
  function setArmorCategory(value: ArmorCategory): void {
    patchArmor({ category: value });
  }

  /**
   * Базовый КД.
   * @param value - КД
   */
  function setBaseArmorClass(value: number | null): void {
    patchArmor({ baseArmorClass: Math.max(0, Math.trunc(value ?? 0)) });
  }

  /**
   * Сила, нужная доспеху; пусто — не нужна.
   * @param value - значение Силы
   */
  function setStrengthRequirement(value: number | null): void {
    patchArmor({
      strengthRequirement: value ? Math.max(0, Math.trunc(value)) : null,
    });
  }

  /**
   * Помеха Скрытности.
   * @param value - отметка
   */
  function setStealth(value: boolean | 'indeterminate'): void {
    patchArmor({ stealthDisadvantage: value === true });
  }

  /**
   * Требует ли предмет настройки.
   * @param value - отметка
   */
  function setRequiresAttunement(value: boolean): void {
    patchDraft({
      requiresAttunement: value,
      isAttuned: value ? (draft.value?.isAttuned ?? false) : false,
    });
  }

  /**
   * Включается ли предмет.
   * @param value - отметка
   */
  function setActivatable(value: boolean): void {
    patchDraft({
      activatable: value,
      isActive: value && (draft.value?.isActive ?? false),
    });
  }

  /**
   * Максимум зарядов; ноль — зарядов нет.
   * @param value - максимум
   */
  function setChargesMax(value: number | null): void {
    const max = Math.max(0, Math.trunc(value ?? 0));
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
    :title="title"
    :ui="{ content: 'max-w-xl', footer: 'justify-end' }"
  >
    <template #body>
      <UTabs
        v-if="draft"
        :items="tabs"
        default-value="main"
        :unmount-on-hide="false"
        :ui="{ content: 'pt-4' }"
      >
        <template #main>
          <div class="flex flex-col gap-3">
            <p
              v-if="!isCustom"
              class="text-xs text-dimmed"
            >
              {{ ITEM_FORM_TEXT.catalogHint }}
            </p>

            <div class="grid grid-cols-[1fr_auto] gap-2">
              <UFormField :label="SHEET_LABELS.name">
                <UInput
                  :model-value="draft.name"
                  :disabled="!isCustom"
                  class="w-full"
                  @update:model-value="setName"
                />
              </UFormField>

              <UFormField :label="ITEM_FORM_TEXT.kind">
                <USelect
                  :model-value="kind"
                  :items="kindItems"
                  :disabled="!isCustom"
                  class="w-32"
                  @update:model-value="setKind"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UFormField :label="SHEET_LABELS.quantity">
                <UInputNumber
                  :model-value="draft.quantity"
                  :min="0"
                  class="w-full"
                  @update:model-value="setQuantity"
                />
              </UFormField>

              <UFormField
                :label="`${SHEET_LABELS.weight}, ${SHEET_LABELS.weightUnit}`"
              >
                <UInputNumber
                  :model-value="draft.weight"
                  :min="0"
                  :step="0.25"
                  :disabled="!isCustom"
                  class="w-full"
                  @update:model-value="setWeight"
                />
              </UFormField>

              <UFormField :label="ITEM_FORM_TEXT.cost">
                <UInput
                  :model-value="draft.cost"
                  :placeholder="ITEM_FORM_TEXT.costPlaceholder"
                  :disabled="!isCustom"
                  class="w-full"
                  @update:model-value="setCost"
                />
              </UFormField>
            </div>

            <div
              v-if="draft.weapon && isCustom"
              class="flex flex-col gap-3 rounded-lg border border-default/50 p-3"
            >
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <UFormField :label="ITEM_FORM_TEXT.category">
                  <USelect
                    :model-value="weaponCategory"
                    :items="categoryItems"
                    class="w-full"
                    @update:model-value="setWeaponCategory"
                  />
                </UFormField>

                <UFormField :label="ITEM_FORM_TEXT.diceCount">
                  <UInputNumber
                    :model-value="damageDice.count"
                    :min="DAMAGE_DICE_COUNT.min"
                    :max="DAMAGE_DICE_COUNT.max"
                    class="w-full"
                    @update:model-value="setDiceCount"
                  />
                </UFormField>

                <UFormField :label="ITEM_FORM_TEXT.diceFaces">
                  <USelect
                    :model-value="damageDice.faces"
                    :items="faceItems"
                    class="w-full"
                    @update:model-value="setDiceFaces"
                  />
                </UFormField>

                <UFormField :label="ITEM_FORM_TEXT.versatile">
                  <USelect
                    :model-value="versatileFaces"
                    :items="optionalFaceItems"
                    class="w-full"
                    @update:model-value="setVersatile"
                  />
                </UFormField>
              </div>

              <UFormField :label="SHEET_LABELS.damageType">
                <USelect
                  :model-value="draft.weapon.damageType"
                  :items="damageTypeItems"
                  class="w-full"
                  @update:model-value="setDamageType"
                />
              </UFormField>

              <div class="flex flex-wrap gap-x-4 gap-y-2">
                <UCheckbox
                  :model-value="draft.weapon.isFinesse"
                  :label="SHEET_LABELS.finesse"
                  @update:model-value="setWeaponFlag('isFinesse', $event)"
                />

                <UCheckbox
                  :model-value="draft.weapon.isRanged"
                  :label="SHEET_LABELS.ranged"
                  @update:model-value="setWeaponFlag('isRanged', $event)"
                />

                <UCheckbox
                  :model-value="draft.weapon.isHeavy"
                  :label="ITEM_FORM_TEXT.heavy"
                  @update:model-value="setWeaponFlag('isHeavy', $event)"
                />
              </div>
            </div>

            <UFormField
              v-if="draft.weapon"
              :label="SHEET_LABELS.proficient"
              :hint="weaponProficiencyHint"
            >
              <USelect
                :model-value="weaponProficiency"
                :items="weaponProficiencyItems"
                class="w-full"
                @update:model-value="setWeaponProficiency"
              />
            </UFormField>

            <div
              v-if="draft.armor && isCustom"
              class="grid grid-cols-3 gap-2 rounded-lg border border-default/50 p-3"
            >
              <UFormField :label="SHEET_LABELS.armorCategory">
                <USelect
                  :model-value="draft.armor.category"
                  :items="armorCategoryItems"
                  class="w-full"
                  @update:model-value="setArmorCategory"
                />
              </UFormField>

              <UFormField :label="SHEET_LABELS.baseArmorClass">
                <UInputNumber
                  :model-value="draft.armor.baseArmorClass"
                  :min="0"
                  class="w-full"
                  @update:model-value="setBaseArmorClass"
                />
              </UFormField>

              <UFormField :label="ITEM_FORM_TEXT.strengthRequirement">
                <UInputNumber
                  :model-value="draft.armor.strengthRequirement ?? undefined"
                  :min="0"
                  class="w-full"
                  @update:model-value="setStrengthRequirement"
                />
              </UFormField>

              <UCheckbox
                :model-value="draft.armor.stealthDisadvantage"
                :label="SHEET_LABELS.stealthDisadvantage"
                class="col-span-3"
                @update:model-value="setStealth"
              />
            </div>

            <UFormField
              v-if="isCustom"
              :label="ITEM_FORM_TEXT.description"
            >
              <UTextarea
                :model-value="draft.description"
                :placeholder="ITEM_FORM_TEXT.descriptionPlaceholder"
                :rows="3"
                autoresize
                class="w-full"
                @update:model-value="setDescription"
              />
            </UFormField>

            <UFormField :label="SHEET_LABELS.notes">
              <UTextarea
                :model-value="draft.notes"
                :rows="2"
                autoresize
                class="w-full"
                @update:model-value="setNotes"
              />
            </UFormField>
          </div>
        </template>

        <template #magic>
          <div class="flex flex-col gap-3">
            <UFormField
              v-if="draft.weapon || draft.armor"
              :label="SHEET_LABELS.magicBonus"
            >
              <UInputNumber
                :model-value="draft.weapon?.bonus ?? draft.armor?.bonus ?? 0"
                class="w-40"
                @update:model-value="setMagicBonus"
              />
            </UFormField>

            <div
              v-if="draft.weapon"
              class="grid grid-cols-3 gap-2"
            >
              <UFormField :label="ITEM_FORM_TEXT.extraDamage">
                <USelect
                  :model-value="extraFaces"
                  :items="optionalFaceItems"
                  class="w-full"
                  @update:model-value="setExtraFaces"
                />
              </UFormField>

              <UFormField :label="ITEM_FORM_TEXT.diceCount">
                <UInputNumber
                  :model-value="extraDice?.count ?? 1"
                  :min="DAMAGE_DICE_COUNT.min"
                  :max="DAMAGE_DICE_COUNT.max"
                  :disabled="!extraDice"
                  class="w-full"
                  @update:model-value="setExtraCount"
                />
              </UFormField>

              <UFormField :label="SHEET_LABELS.damageType">
                <USelect
                  :model-value="draft.weapon.extraDamageType"
                  :items="damageTypeItems"
                  :disabled="!extraDice"
                  class="w-full"
                  @update:model-value="setExtraType"
                />
              </UFormField>
            </div>

            <div class="flex flex-col gap-2">
              <USwitch
                :model-value="draft.requiresAttunement"
                :label="ATTUNEMENT_TEXT.requires"
                @update:model-value="setRequiresAttunement"
              />

              <USwitch
                :model-value="draft.activatable"
                :label="ITEM_FORM_TEXT.activatable"
                :description="ITEM_FORM_TEXT.activatableHint"
                @update:model-value="setActivatable"
              />
            </div>

            <div class="grid grid-cols-[auto_1fr] items-end gap-2">
              <UFormField :label="ATTUNEMENT_TEXT.charges">
                <UInputNumber
                  :model-value="draft.charges?.max ?? 0"
                  :min="0"
                  class="w-28"
                  @update:model-value="setChargesMax"
                />
              </UFormField>

              <UFormField
                v-if="draft.charges"
                :label="ATTUNEMENT_TEXT.recharge"
              >
                <div class="flex gap-2">
                  <UInput
                    :model-value="draft.charges.recharge"
                    placeholder="1к6+1"
                    class="min-w-0 flex-1"
                    @update:model-value="setRecharge"
                  />

                  <USelect
                    :model-value="draft.charges.rechargeEvent"
                    :items="rechargeItems"
                    class="w-48"
                    @update:model-value="setRechargeEvent"
                  />
                </div>
              </UFormField>
            </div>

            <div class="flex flex-col gap-1.5 rounded-lg bg-elevated/40 p-3">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ ITEM_FORM_TEXT.summary }}
              </span>

              <span
                v-for="line in summary"
                :key="line"
                class="flex gap-1.5 text-sm text-toned"
              >
                <UIcon
                  name="tabler:sparkles"
                  class="mt-0.5 size-4 shrink-0 text-primary"
                />

                {{ line }}
              </span>

              <span
                v-if="!summary.length"
                class="text-xs text-dimmed italic"
              >
                {{ ITEM_FORM_TEXT.summaryEmpty }}
              </span>
            </div>
          </div>
        </template>
      </UTabs>
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
