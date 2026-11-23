<script setup lang="ts">
  import type { SpellDamageForm } from '../model';

  import {
    createSpellDamageRoll,
    SPELL_DAMAGE_MAX_ROLLS,
    SPELL_DAMAGE_TEXT,
    SPELL_DAMAGE_TYPE_OPTIONS,
  } from '../model';

  /**
   * Урон заклинания для листа персонажа: броски с костями, бонусом,
   * модификатором характеристики, типами и условием; рост заговора и кости
   * за каждый круг выше. Поля проверяет форма заклинания (`damage.*`).
   */
  const { isCantrip } = defineProps<{
    /** Заклинание — заговор: у него рост по уровню, а не по кругу. */
    isCantrip: boolean;
  }>();

  const damage = defineModel<SpellDamageForm>({ required: true });

  const typeItems = [...SPELL_DAMAGE_TYPE_OPTIONS];

  const canAdd = computed(
    () => damage.value.rolls.length < SPELL_DAMAGE_MAX_ROLLS,
  );

  function addRoll(): void {
    damage.value.rolls.push(createSpellDamageRoll());
  }

  /**
   * Убирает бросок.
   * @param index - номер броска
   */
  function removeRoll(index: number): void {
    damage.value.rolls.splice(index, 1);
  }
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg border border-default p-3">
    <div class="flex flex-col gap-1">
      <span class="text-sm font-semibold text-highlighted">
        {{ SPELL_DAMAGE_TEXT.title }}
      </span>

      <span class="text-xs text-muted">{{ SPELL_DAMAGE_TEXT.hint }}</span>
    </div>

    <p
      v-if="!damage.rolls.length"
      class="text-sm text-dimmed"
    >
      {{ SPELL_DAMAGE_TEXT.empty }}
    </p>

    <div
      v-for="(roll, index) in damage.rolls"
      :key="index"
      class="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border border-default/60 p-2 md:grid-cols-6"
    >
      <UFormField
        :label="SPELL_DAMAGE_TEXT.dice"
        :name="`damage.rolls.${index}.dice`"
      >
        <UInput
          v-model="roll.dice"
          :placeholder="SPELL_DAMAGE_TEXT.dicePlaceholder"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="SPELL_DAMAGE_TEXT.bonus"
        :name="`damage.rolls.${index}.bonus`"
      >
        <UInputNumber
          v-model="roll.bonus"
          :min="-99"
          :max="99"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="SPELL_DAMAGE_TEXT.types"
        class="col-span-2"
      >
        <USelectMenu
          v-model="roll.types"
          :items="typeItems"
          value-key="value"
          :placeholder="SPELL_DAMAGE_TEXT.typesPlaceholder"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="SPELL_DAMAGE_TEXT.condition"
        class="col-span-2"
      >
        <UInput
          v-model="roll.condition"
          :placeholder="SPELL_DAMAGE_TEXT.conditionPlaceholder"
          class="w-full"
        />
      </UFormField>

      <div class="col-span-full flex flex-wrap items-center gap-x-6 gap-y-2">
        <UCheckbox
          v-model="roll.abilityModifier"
          :label="SPELL_DAMAGE_TEXT.abilityModifier"
        />

        <UCheckbox
          v-model="roll.healing"
          :label="SPELL_DAMAGE_TEXT.healing"
        />

        <UButton
          :label="SPELL_DAMAGE_TEXT.remove"
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          class="ml-auto"
          @click.left.exact.prevent="removeRoll(index)"
        />
      </div>
    </div>

    <UButton
      v-if="canAdd"
      :label="SPELL_DAMAGE_TEXT.add"
      icon="tabler:plus"
      color="neutral"
      variant="subtle"
      size="sm"
      class="self-start"
      @click.left.exact.prevent="addRoll"
    />

    <template v-if="damage.rolls.length">
      <UCheckbox
        v-if="isCantrip"
        v-model="damage.cantripScaling"
        :label="SPELL_DAMAGE_TEXT.cantripScaling"
      />

      <UFormField
        v-else
        :label="SPELL_DAMAGE_TEXT.upcastDice"
        :help="SPELL_DAMAGE_TEXT.upcastHelp"
        name="damage.upcastDice"
        class="max-w-48"
      >
        <UInput
          v-model="damage.upcastDice"
          :placeholder="SPELL_DAMAGE_TEXT.dicePlaceholder"
          class="w-full"
        />
      </UFormField>
    </template>
  </div>
</template>
