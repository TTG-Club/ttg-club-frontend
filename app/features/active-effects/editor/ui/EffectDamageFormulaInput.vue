<script setup lang="ts">
  import type { EffectDamageFormulaToolSlot } from '../../model';

  import {
    buildEffectDamageFormulaTag,
    EFFECT_DAMAGE_FORMULA_CONDITION_TAGS,
    EFFECT_DAMAGE_FORMULA_CREATURE_TYPE_TAGS,
    EFFECT_DAMAGE_FORMULA_DICE,
    EFFECT_DAMAGE_FORMULA_HEALING_TAGS,
    EFFECT_DAMAGE_FORMULA_LABELS,
    incrementEffectDamageFormulaDice,
    insertIntoEffectDamageFormula,
  } from '../../model';

  /**
   * Поле формулы урона эффекта с вкладками-помощниками: кости, типы урона,
   * лечение и условия по цели.
   *
   * Перенос поля формулы урона нового сайта (`~ui/damage-formula`) в объёме,
   * нужном эффектам: вкладки модификаторов нет — нагрузка эффекта считается
   * без характеристики носителя, как в редакторе эффектов VTTG.
   */
  interface DamageTypeOption {
    /** Подпись типа урона. */
    label: string;
    /** Хвост токена без приставки `@`, напр. `dmg.fire`. */
    value: string;
  }

  const {
    damageTypeOptions,
    label = EFFECT_DAMAGE_FORMULA_LABELS.formula,
    placeholder = EFFECT_DAMAGE_FORMULA_LABELS.formulaPlaceholder,
    hideHealing = false,
    hideConditions = false,
  } = defineProps<{
    /** Типы урона для одноимённой вкладки. */
    damageTypeOptions: Array<DamageTypeOption>;
    /** Подпись поля формулы. */
    label?: string;
    /** Подсказка в пустом поле. */
    placeholder?: string;
    /** Скрыть вкладку лечения. */
    hideHealing?: boolean;
    /** Скрыть вкладки условий: по хитам цели и по её типу. */
    hideConditions?: boolean;
  }>();

  const model = defineModel<string>({ required: true });

  const inputRef = useTemplateRef<{
    inputRef?: HTMLInputElement;
    $el?: HTMLElement;
  }>('inputRef');

  const inputElement = computed(
    () =>
      inputRef.value?.inputRef ?? inputRef.value?.$el?.querySelector('input'),
  );

  const tools = computed<
    Array<{ label: string; slot: EffectDamageFormulaToolSlot }>
  >(() => {
    const items: Array<{ label: string; slot: EffectDamageFormulaToolSlot }> = [
      { label: EFFECT_DAMAGE_FORMULA_LABELS.dice, slot: 'dice' },
      { label: EFFECT_DAMAGE_FORMULA_LABELS.damageTypes, slot: 'damageTypes' },
    ];

    if (!hideHealing) {
      items.push({
        label: EFFECT_DAMAGE_FORMULA_LABELS.healing,
        slot: 'healing',
      });
    }

    if (!hideConditions) {
      items.push(
        { label: EFFECT_DAMAGE_FORMULA_LABELS.conditions, slot: 'conditions' },
        {
          label: EFFECT_DAMAGE_FORMULA_LABELS.creatureTypes,
          slot: 'creatureTypes',
        },
      );
    }

    return items;
  });

  /**
   * Возвращает границы выделения в поле формулы. Поля в DOM нет — вставка идёт
   * в конец формулы.
   *
   * @returns начало и конец выделения.
   */
  function getSelection(): { start: number; end: number } {
    const element = inputElement.value;
    const length = model.value.length;

    if (!element) {
      return { start: length, end: length };
    }

    return {
      start: element.selectionStart ?? length,
      end: element.selectionEnd ?? length,
    };
  }

  /**
   * Вставляет текст на место курсора и возвращает курсор за вставленный
   * фрагмент: иначе после каждой кнопки пришлось бы заново целиться в формулу.
   *
   * @param text вставляемый текст.
   */
  async function insertText(text: string): Promise<void> {
    const { start, end } = getSelection();

    const insertion = insertIntoEffectDamageFormula(
      model.value,
      text,
      start,
      end,
    );

    model.value = insertion.formula;

    await nextTick();

    const element = inputElement.value;

    if (!element) {
      return;
    }

    element.focus();
    element.setSelectionRange(insertion.cursor, insertion.cursor);
  }

  /**
   * Вставляет тег формулы по курсору.
   *
   * @param tag тег без приставки `@`.
   */
  function insertTag(tag: string): Promise<void> {
    return insertText(buildEffectDamageFormulaTag(tag));
  }

  /**
   * Добавляет кость или наращивает количество уже указанной кости того же
   * размера.
   *
   * @param diceValue размер кости.
   */
  function incrementDice(diceValue: number): void {
    model.value = incrementEffectDamageFormulaDice(model.value, diceValue);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <UFormField :label="label">
      <UInput
        ref="inputRef"
        v-model="model"
        :placeholder="placeholder"
        class="w-full font-mono"
      />
    </UFormField>

    <UTabs
      :items="tools"
      variant="link"
      class="w-full"
      :ui="{
        list: 'border-b border-default mb-2',
        trigger: 'justify-center py-1 text-xs',
        content:
          'p-2 bg-elevated/20 rounded-lg border border-default/50 min-h-15',
      }"
    >
      <template #dice>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="dice in EFFECT_DAMAGE_FORMULA_DICE"
            :key="dice.value"
            :label="dice.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="incrementDice(dice.value)"
          />
        </div>
      </template>

      <template #damageTypes>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="damageType in damageTypeOptions"
            :key="damageType.value"
            :label="damageType.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(damageType.value)"
          />
        </div>
      </template>

      <template #healing>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="healing in EFFECT_DAMAGE_FORMULA_HEALING_TAGS"
            :key="healing.value"
            :label="healing.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(healing.value)"
          />
        </div>
      </template>

      <template #conditions>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="condition in EFFECT_DAMAGE_FORMULA_CONDITION_TAGS"
            :key="condition.value"
            :label="condition.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(condition.value)"
          />
        </div>
      </template>

      <!-- Слагаемое достаётся только целям названного типа -->
      <template #creatureTypes>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="creatureType in EFFECT_DAMAGE_FORMULA_CREATURE_TYPE_TAGS"
            :key="creatureType.value"
            :label="creatureType.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(creatureType.value)"
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>
