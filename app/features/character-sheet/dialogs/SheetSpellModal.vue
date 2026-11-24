<script setup lang="ts">
  import type { SpellDamageRollData } from '~character/model';

  import type { SheetSpell } from '../model';

  import { range } from 'es-toolkit';

  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    DAMAGE_TYPE_INFO,
    parseDice,
    SHEET_ICON,
    SPELL_ABILITY_TEXT,
    SPELL_DAMAGE_MAX_ROLLS,
    SPELL_DAMAGE_TYPE_KEYS,
    SPELL_FORM_TEXT,
    SPELL_GROUP_TEXT,
    SPELL_LEVEL,
    SPELL_SCHOOLS,
  } from '../model';

  /**
   * Своё заклинание, как на new.ttg.club: вкладка «Основное» — круг, школа,
   * признаки, характеристики и описание; вкладка «Урон» — броски с костями,
   * бонусом, модификатором, типом и условием, рост заговора и кости за
   * круг выше.
   */
  const { spell } = defineProps<{
    spell: SheetSpell | null;
  }>();

  const emit = defineEmits<{
    save: [spell: SheetSpell];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  /** Пункт «Как у класса» и «Без типа». */
  const NONE = 'NONE';

  const draft = ref<SheetSpell | null>(null);
  const diceError = ref(false);

  watch(
    () => [isOpen.value, spell] as const,
    ([open, source]) => {
      if (open && source) {
        draft.value = {
          ...source,
          damage: source.damage
            ? {
                ...source.damage,
                rolls: source.damage.rolls.map((roll) => ({ ...roll })),
              }
            : null,
        };

        diceError.value = false;
      }
    },
    { immediate: true },
  );

  const title = computed(() =>
    spell?.name ? SPELL_FORM_TEXT.editTitle : SPELL_FORM_TEXT.createTitle,
  );

  const tabs = [
    { label: SPELL_FORM_TEXT.tabMain, value: 'main', slot: 'main' },
    { label: SPELL_FORM_TEXT.tabDamage, value: 'damage', slot: 'damage' },
  ];

  const levelItems = range(SPELL_LEVEL.min, SPELL_LEVEL.max + 1).map(
    (level) => ({
      label: level ? String(level) : SPELL_GROUP_TEXT.cantrips,
      value: level,
    }),
  );

  /** Школы; своя школа из черновика остаётся в списке. */
  const schoolItems = computed(() =>
    [...new Set<string>([...SPELL_SCHOOLS, draft.value?.school ?? ''])]
      .filter(Boolean)
      .map((school) => ({ label: school, value: school })),
  );

  const abilityItems = [
    { label: SPELL_ABILITY_TEXT.inherit, value: NONE },
    ...ABILITY_KEYS.map((key) => ({
      label: ABILITY_LABELS[key].name,
      value: key,
    })),
  ];

  const typeItems = [
    { label: SPELL_FORM_TEXT.noType, value: NONE },
    ...SPELL_DAMAGE_TYPE_KEYS.map((key) => ({
      label: DAMAGE_TYPE_INFO[key]?.label ?? key,
      value: key,
    })),
  ];

  const rolls = computed(() => draft.value?.damage?.rolls ?? []);
  const isCantrip = computed(() => draft.value?.level === 0);

  const canAddRoll = computed(
    () => rolls.value.length < SPELL_DAMAGE_MAX_ROLLS,
  );

  /**
   * Меняет поле черновика.
   * @param patch - изменённые поля
   */
  function patch(patch: Partial<SheetSpell>): void {
    if (draft.value) {
      draft.value = { ...draft.value, ...patch };
    }
  }

  /**
   * Концентрация.
   * @param value - отмечено ли
   */
  function setConcentration(value: boolean | 'indeterminate'): void {
    patch({ isConcentration: value === true });
  }

  /**
   * Ритуал.
   * @param value - отмечено ли
   */
  function setRitual(value: boolean | 'indeterminate'): void {
    patch({ isRitual: value === true });
  }

  /**
   * Своя характеристика.
   * @param value - пункт списка
   */
  function setAbility(value: unknown): void {
    patch({
      spellcastingAbility: ABILITY_KEYS.find((key) => key === value) ?? null,
    });
  }

  /**
   * Круг заклинания.
   * @param value - круг
   */
  function setLevel(value: unknown): void {
    patch({ level: typeof value === 'number' ? value : 0 });
  }

  /**
   * Меняет урон черновика.
   * @param change - изменённые поля урона
   */
  function patchDamage(
    change: Partial<NonNullable<SheetSpell['damage']>>,
  ): void {
    const current = draft.value?.damage ?? {
      rolls: [],
      cantripScaling: false,
      upcastDice: null,
    };

    patch({ damage: { ...current, ...change } });
  }

  /**
   * Меняет бросок урона.
   * @param index - номер броска
   * @param change - изменённые поля
   */
  function patchRoll(
    index: number,
    change: Partial<SpellDamageRollData>,
  ): void {
    patchDamage({
      rolls: rolls.value.map((roll, rollIndex) =>
        rollIndex === index ? { ...roll, ...change } : roll,
      ),
    });
  }

  function addRoll(): void {
    patchDamage({
      rolls: [
        ...rolls.value,
        {
          dice: '',
          bonus: 0,
          abilityModifier: false,
          types: [],
          healing: false,
          condition: null,
        },
      ],
    });
  }

  /**
   * Убирает бросок.
   * @param index - номер броска
   */
  function removeRoll(index: number): void {
    patchDamage({
      rolls: rolls.value.filter((_, rollIndex) => rollIndex !== index),
    });
  }

  /**
   * Кости броска.
   * @param index - номер броска
   * @param value - кости текстом
   */
  function setRollDice(index: number, value: string | number): void {
    patchRoll(index, { dice: String(value) });
  }

  /**
   * Бонус броска.
   * @param index - номер броска
   * @param value - бонус
   */
  function setRollBonus(index: number, value: number | null): void {
    patchRoll(index, { bonus: Math.trunc(value ?? 0) });
  }

  /**
   * Тип урона броска.
   * @param index - номер броска
   * @param value - пункт списка
   */
  function setRollType(index: number, value: unknown): void {
    patchRoll(index, {
      types: typeof value === 'string' && value !== NONE ? [value] : [],
    });
  }

  /**
   * Модификатор характеристики в броске.
   * @param index - номер броска
   * @param value - включён ли
   */
  function setRollModifier(
    index: number,
    value: boolean | 'indeterminate',
  ): void {
    patchRoll(index, { abilityModifier: value === true });
  }

  /**
   * Бросок лечит.
   * @param index - номер броска
   * @param value - включено ли
   */
  function setRollHealing(
    index: number,
    value: boolean | 'indeterminate',
  ): void {
    patchRoll(index, { healing: value === true });
  }

  /**
   * Условие броска.
   * @param index - номер броска
   * @param value - условие
   */
  function setRollCondition(index: number, value: string | number): void {
    patchRoll(index, { condition: String(value) || null });
  }

  /**
   * Кости за каждый круг выше.
   * @param value - кости текстом
   */
  function setUpcast(value: string | number): void {
    patchDamage({ upcastDice: String(value) || null });
  }

  /**
   * Рост заговора.
   * @param value - включён ли
   */
  function setCantripScaling(value: boolean | 'indeterminate'): void {
    patchDamage({ cantripScaling: value === true });
  }

  /**
   * Кости заданы верно либо не заданы.
   * @param value - кости текстом
   */
  function isDiceValid(value: string | null | undefined): boolean {
    return !value?.trim() || parseDice(value) !== null;
  }

  function save(): void {
    const current = draft.value;

    if (!current) {
      return;
    }

    const damage = current.damage;

    const isValid =
      !damage
      || (damage.rolls.every((roll) => isDiceValid(roll.dice))
        && isDiceValid(damage.upcastDice));

    if (!isValid) {
      diceError.value = true;

      return;
    }

    const filled =
      damage?.rolls.filter(
        (roll) => roll.dice?.trim() || roll.bonus || roll.abilityModifier,
      ) ?? [];

    emit('save', {
      ...current,
      name: current.name.trim() || SPELL_FORM_TEXT.createTitle,
      damage:
        damage && filled.length
          ? {
              rolls: filled.map((roll) => ({
                ...roll,
                dice: roll.dice?.trim() || null,
              })),
              cantripScaling: current.level === 0 && damage.cantripScaling,
              upcastDice:
                current.level > 0 ? damage.upcastDice?.trim() || null : null,
            }
          : null,
    });

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
    :ui="{ content: 'max-w-xl' }"
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
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              :label="SPELL_FORM_TEXT.name"
              class="col-span-2"
            >
              <UInput
                :model-value="draft.name"
                class="w-full"
                autofocus
                @update:model-value="patch({ name: String($event) })"
              />
            </UFormField>

            <UFormField :label="SPELL_FORM_TEXT.level">
              <USelect
                :model-value="draft.level"
                :items="levelItems"
                class="w-full"
                @update:model-value="setLevel"
              />
            </UFormField>

            <UFormField :label="SPELL_FORM_TEXT.school">
              <USelectMenu
                :model-value="draft.school"
                :items="schoolItems"
                value-key="value"
                create-item
                class="w-full"
                @update:model-value="patch({ school: String($event ?? '') })"
                @create="patch({ school: $event })"
              />
            </UFormField>

            <div class="col-span-2 flex flex-wrap gap-x-6 gap-y-2">
              <UCheckbox
                :model-value="draft.isConcentration"
                :label="SPELL_FORM_TEXT.concentration"
                @update:model-value="setConcentration"
              />

              <UCheckbox
                :model-value="draft.isRitual"
                :label="SPELL_FORM_TEXT.ritual"
                @update:model-value="setRitual"
              />
            </div>

            <UFormField :label="SPELL_FORM_TEXT.castingTime">
              <UInput
                :model-value="draft.castingTime"
                class="w-full"
                @update:model-value="patch({ castingTime: String($event) })"
              />
            </UFormField>

            <UFormField :label="SPELL_FORM_TEXT.range">
              <UInput
                :model-value="draft.range"
                class="w-full"
                @update:model-value="patch({ range: String($event) })"
              />
            </UFormField>

            <UFormField :label="SPELL_FORM_TEXT.components">
              <UInput
                :model-value="draft.components"
                class="w-full"
                @update:model-value="patch({ components: String($event) })"
              />
            </UFormField>

            <UFormField :label="SPELL_FORM_TEXT.duration">
              <UInput
                :model-value="draft.duration"
                class="w-full"
                @update:model-value="patch({ duration: String($event) })"
              />
            </UFormField>

            <UFormField
              :label="SPELL_FORM_TEXT.ability"
              class="col-span-2"
            >
              <USelect
                :model-value="draft.spellcastingAbility ?? NONE"
                :items="abilityItems"
                class="w-full"
                @update:model-value="setAbility"
              />
            </UFormField>

            <UFormField
              :label="SPELL_FORM_TEXT.description"
              class="col-span-2"
            >
              <UTextarea
                :model-value="draft.description"
                :rows="6"
                autoresize
                class="w-full"
                @update:model-value="patch({ description: String($event) })"
              />
            </UFormField>
          </div>
        </template>

        <template #damage>
          <div class="flex flex-col gap-3">
            <p
              v-if="!rolls.length"
              class="text-sm text-dimmed"
            >
              {{ SPELL_FORM_TEXT.noRolls }}
            </p>

            <div
              v-for="(roll, index) in rolls"
              :key="index"
              class="grid grid-cols-2 gap-2 rounded-lg border border-default/50 p-2 sm:grid-cols-4"
            >
              <UFormField :label="SPELL_FORM_TEXT.dice">
                <UInput
                  :model-value="roll.dice ?? ''"
                  :placeholder="SPELL_FORM_TEXT.dicePlaceholder"
                  :color="isDiceValid(roll.dice) ? undefined : 'error'"
                  class="w-full"
                  @update:model-value="setRollDice(index, $event)"
                />
              </UFormField>

              <UFormField :label="SPELL_FORM_TEXT.bonus">
                <UInputNumber
                  :model-value="roll.bonus"
                  class="w-full"
                  @update:model-value="setRollBonus(index, $event)"
                />
              </UFormField>

              <UFormField
                :label="SPELL_FORM_TEXT.type"
                class="col-span-2"
              >
                <USelect
                  :model-value="roll.types[0] ?? NONE"
                  :items="typeItems"
                  class="w-full"
                  @update:model-value="setRollType(index, $event)"
                />
              </UFormField>

              <UFormField
                :label="SPELL_FORM_TEXT.condition"
                class="col-span-2 sm:col-span-4"
              >
                <UInput
                  :model-value="roll.condition ?? ''"
                  class="w-full"
                  @update:model-value="setRollCondition(index, $event)"
                />
              </UFormField>

              <div
                class="col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-4"
              >
                <UCheckbox
                  :model-value="roll.abilityModifier"
                  :label="SPELL_FORM_TEXT.abilityModifier"
                  @update:model-value="setRollModifier(index, $event)"
                />

                <UCheckbox
                  :model-value="roll.healing"
                  :label="SPELL_FORM_TEXT.healing"
                  @update:model-value="setRollHealing(index, $event)"
                />

                <UButton
                  :icon="SHEET_ICON.remove"
                  :label="SPELL_FORM_TEXT.removeRoll"
                  color="error"
                  variant="ghost"
                  size="xs"
                  class="ml-auto"
                  @click.left.exact.prevent="removeRoll(index)"
                />
              </div>
            </div>

            <UButton
              v-if="canAddRoll"
              :icon="SHEET_ICON.add"
              :label="SPELL_FORM_TEXT.addRoll"
              color="neutral"
              variant="subtle"
              size="sm"
              class="self-start"
              @click.left.exact.prevent="addRoll"
            />

            <template v-if="rolls.length">
              <USwitch
                v-if="isCantrip"
                :model-value="draft.damage?.cantripScaling ?? false"
                :label="SPELL_FORM_TEXT.cantripScaling"
                @update:model-value="setCantripScaling"
              />

              <UFormField
                v-else
                :label="SPELL_FORM_TEXT.upcastDice"
                class="max-w-48"
              >
                <UInput
                  :model-value="draft.damage?.upcastDice ?? ''"
                  :placeholder="SPELL_FORM_TEXT.dicePlaceholder"
                  :color="
                    isDiceValid(draft.damage?.upcastDice) ? undefined : 'error'
                  "
                  class="w-full"
                  @update:model-value="setUpcast"
                />
              </UFormField>
            </template>

            <p
              v-if="diceError"
              class="text-xs text-error"
            >
              {{ SPELL_FORM_TEXT.invalidDice }}
            </p>
          </div>
        </template>
      </UTabs>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SPELL_FORM_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="SPELL_FORM_TEXT.save"
          @click.left.exact.prevent="save"
        />
      </div>
    </template>
  </UModal>
</template>
