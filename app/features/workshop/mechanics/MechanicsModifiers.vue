<script setup lang="ts">
  import type { ModifiersForm } from '../model';

  import {
    getModifiersFilledCount,
    MECHANICS_CONDITION_OPTIONS,
    MECHANICS_DAMAGE_TYPE_OPTIONS,
    MECHANICS_DEFENSE_KIND_OPTIONS,
    MECHANICS_ICON,
    MECHANICS_SENSE_OPTIONS,
    MECHANICS_TEXT,
    RACE_TYPE_OPTIONS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';
  import MechanicsRow from './MechanicsRow.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /**
   * Постоянные модификаторы листа: хиты, скорости, КД, инициатива, чувства,
   * защиты от урона и иммунитет к состояниям.
   */
  const modifiers = defineModel<ModifiersForm>({ required: true });

  const damageItems = [...MECHANICS_DAMAGE_TYPE_OPTIONS];
  const conditionItems = [...MECHANICS_CONDITION_OPTIONS];
  const senseItems = [...MECHANICS_SENSE_OPTIONS];
  const defenseKindItems = [...MECHANICS_DEFENSE_KIND_OPTIONS];
  const creatureTypeItems = [...RACE_TYPE_OPTIONS];

  /** Сколько модификаторов заполнено. */
  const filledCount = computed(() => getModifiersFilledCount(modifiers.value));

  function addSense(): void {
    modifiers.value.senses = [
      ...modifiers.value.senses,
      { type: undefined, range: null },
    ];
  }

  /**
   * Убирает чувство.
   * @param index - номер строки
   */
  function removeSense(index: number): void {
    modifiers.value.senses = modifiers.value.senses.filter(
      (_, position) => position !== index,
    );
  }

  function addDefenseChoice(): void {
    modifiers.value.damage.defenseChoices = [
      ...modifiers.value.damage.defenseChoices,
      { choiceKey: '', kind: undefined },
    ];
  }

  /**
   * Убирает защиту от выбранного типа урона.
   * @param index - номер строки
   */
  function removeDefenseChoice(index: number): void {
    modifiers.value.damage.defenseChoices =
      modifiers.value.damage.defenseChoices.filter(
        (_, position) => position !== index,
      );
  }
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.modifiers"
    :count="filledCount"
  >
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <UFormField :label="MECHANICS_TEXT.armorClassBonus">
        <UInputNumber
          v-model="modifiers.armorClassBonus"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.initiativeBonus">
        <UInputNumber
          v-model="modifiers.initiativeBonus"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.telepathyRange">
        <UInputNumber
          v-model="modifiers.telepathyRange"
          :min="0"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.creatureType">
        <USelectMenu
          v-model="modifiers.creatureType"
          :items="creatureTypeItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          clear
        />
      </UFormField>

      <div class="col-span-full">
        <UCheckbox
          v-model="modifiers.initiativeProficiencyBonus"
          :label="MECHANICS_TEXT.initiativeProficiencyBonus"
        />
      </div>

      <!-- Хиты -->
      <span class="col-span-full text-sm text-default">
        {{ MECHANICS_TEXT.hitPoints }}
      </span>

      <UFormField :label="MECHANICS_TEXT.hitPointsFlat">
        <UInputNumber
          v-model="modifiers.hitPoints.flat"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.hitPointsPerAcquisitionLevel">
        <UInputNumber
          v-model="modifiers.hitPoints.perAcquisitionLevel"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.hitPointsPerLevelAfter">
        <UInputNumber
          v-model="modifiers.hitPoints.perLevelAfterAcquisition"
          class="w-full"
        />
      </UFormField>

      <!-- Скорости -->
      <span class="col-span-full text-sm text-default">
        {{ MECHANICS_TEXT.speed }}
      </span>

      <UFormField :label="MECHANICS_TEXT.walkBonus">
        <UInputNumber
          v-model="modifiers.speed.walkBonus"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.fly">
        <UInputNumber
          v-model="modifiers.speed.fly"
          :min="0"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.climb">
        <UInputNumber
          v-model="modifiers.speed.climb"
          :min="0"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.swim">
        <UInputNumber
          v-model="modifiers.speed.swim"
          :min="0"
          class="w-full"
        />
      </UFormField>

      <div class="col-span-full flex flex-wrap gap-x-4 gap-y-2">
        <UCheckbox
          v-model="modifiers.speed.flyEqualsWalk"
          :label="MECHANICS_TEXT.flyEqualsWalk"
        />

        <UCheckbox
          v-model="modifiers.speed.climbEqualsWalk"
          :label="MECHANICS_TEXT.climbEqualsWalk"
        />

        <UCheckbox
          v-model="modifiers.speed.swimEqualsWalk"
          :label="MECHANICS_TEXT.swimEqualsWalk"
        />
      </div>

      <!-- Чувства -->
      <div class="col-span-full flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm text-default">{{ MECHANICS_TEXT.senses }}</span>

          <UButton
            :icon="MECHANICS_ICON.add"
            :label="MECHANICS_TEXT.add"
            color="neutral"
            variant="soft"
            size="xs"
            @click.left.exact.prevent="addSense"
          />
        </div>

        <MechanicsRow
          v-for="(sense, index) in modifiers.senses"
          :key="index"
          @remove="removeSense(index)"
        >
          <UFormField
            :label="MECHANICS_TEXT.senseType"
            class="lg:col-span-2"
          >
            <USelectMenu
              v-model="sense.type"
              :items="senseItems"
              :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
              :search-input="false"
              value-key="value"
              class="w-full"
              clear
            />
          </UFormField>

          <UFormField
            :label="MECHANICS_TEXT.range"
            class="lg:col-span-2"
          >
            <UInputNumber
              v-model="sense.range"
              :min="0"
              class="w-full"
            />
          </UFormField>
        </MechanicsRow>
      </div>

      <!-- Защиты от урона -->
      <span class="col-span-full text-sm text-default">
        {{ MECHANICS_TEXT.damage }}
      </span>

      <UFormField
        :label="MECHANICS_TEXT.resistances"
        class="sm:col-span-2"
      >
        <USelectMenu
          v-model="modifiers.damage.resistances"
          :items="damageItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.immunities"
        class="sm:col-span-2"
      >
        <USelectMenu
          v-model="modifiers.damage.immunities"
          :items="damageItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.vulnerabilities"
        class="sm:col-span-2"
      >
        <USelectMenu
          v-model="modifiers.damage.vulnerabilities"
          :items="damageItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.conditionImmunities"
        class="sm:col-span-2"
      >
        <USelectMenu
          v-model="modifiers.conditionImmunities"
          :items="conditionItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <div class="col-span-full flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm text-default">
            {{ MECHANICS_TEXT.defenseChoices }}
          </span>

          <UButton
            :icon="MECHANICS_ICON.add"
            :label="MECHANICS_TEXT.add"
            color="neutral"
            variant="soft"
            size="xs"
            @click.left.exact.prevent="addDefenseChoice"
          />
        </div>

        <MechanicsRow
          v-for="(defense, index) in modifiers.damage.defenseChoices"
          :key="index"
          @remove="removeDefenseChoice(index)"
        >
          <UFormField
            :label="MECHANICS_TEXT.choiceKey"
            class="lg:col-span-2"
          >
            <UInput
              v-model="defense.choiceKey"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="MECHANICS_TEXT.defenseKind"
            class="lg:col-span-2"
          >
            <USelectMenu
              v-model="defense.kind"
              :items="defenseKindItems"
              :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
              :search-input="false"
              value-key="value"
              class="w-full"
              clear
            />
          </UFormField>
        </MechanicsRow>
      </div>
    </div>
  </MechanicsSection>
</template>
