<script setup lang="ts">
  import type { SpellGrantForm } from '../model';

  import {
    createClassSpellListForm,
    createGrantedSpellForm,
    MECHANICS_ICON,
    MECHANICS_LIMIT,
    MECHANICS_TEXT,
    WORKSHOP_ABILITY_OPTIONS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';
  import MechanicsEntityRefs from './MechanicsEntityRefs.vue';
  import MechanicsRow from './MechanicsRow.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /**
   * Заклинания без выбора: отдельные заклинания справочника с уровнем
   * доступа и списки классов целиком, общая заклинательная характеристика.
   */
  const spells = defineModel<SpellGrantForm>({ required: true });

  const abilityItems = [...WORKSHOP_ABILITY_OPTIONS];

  const filledCount = computed(
    () => spells.value.spells.length + spells.value.classLists.length,
  );

  function addSpell(): void {
    spells.value.spells = [...spells.value.spells, createGrantedSpellForm()];
  }

  /**
   * Убирает заклинание.
   * @param index - номер строки
   */
  function removeSpell(index: number): void {
    spells.value.spells = spells.value.spells.filter(
      (_, position) => position !== index,
    );
  }

  function addClassList(): void {
    spells.value.classLists = [
      ...spells.value.classLists,
      createClassSpellListForm(),
    ];
  }

  /**
   * Убирает список класса.
   * @param index - номер строки
   */
  function removeClassList(index: number): void {
    spells.value.classLists = spells.value.classLists.filter(
      (_, position) => position !== index,
    );
  }
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.spells"
    :count="filledCount"
  >
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <UFormField :label="MECHANICS_TEXT.spellcastingAbility">
        <USelectMenu
          v-model="spells.spellcastingAbility"
          :items="abilityItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          clear
        />
      </UFormField>

      <div class="flex items-end">
        <UCheckbox
          v-model="spells.alwaysPrepared"
          :label="MECHANICS_TEXT.alwaysPrepared"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm text-default">{{ MECHANICS_TEXT.spells }}</span>

        <UButton
          :icon="MECHANICS_ICON.add"
          :label="MECHANICS_TEXT.add"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addSpell"
        />
      </div>

      <MechanicsRow
        v-for="(spell, index) in spells.spells"
        :key="index"
        @remove="removeSpell(index)"
      >
        <UFormField :label="MECHANICS_TEXT.url">
          <UInput
            v-model="spell.url"
            :placeholder="MECHANICS_TEXT.urlPlaceholder"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.name">
          <UInput
            v-model="spell.name"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.requiredLevel">
          <UInputNumber
            v-model="spell.requiredLevel"
            :min="1"
            :max="MECHANICS_LIMIT.level"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.spellcastingAbility">
          <USelectMenu
            v-model="spell.spellcastingAbility"
            :items="abilityItems"
            :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
            :search-input="false"
            value-key="value"
            class="w-full"
            clear
          />
        </UFormField>

        <div class="col-span-full flex flex-wrap gap-x-4 gap-y-2">
          <UCheckbox
            v-model="spell.alwaysPrepared"
            :label="MECHANICS_TEXT.alwaysPrepared"
          />

          <UCheckbox
            v-model="spell.limitedBySlots"
            :label="MECHANICS_TEXT.limitedBySlots"
          />
        </div>
      </MechanicsRow>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm text-default">
          {{ MECHANICS_TEXT.classLists }}
        </span>

        <UButton
          :icon="MECHANICS_ICON.add"
          :label="MECHANICS_TEXT.add"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addClassList"
        />
      </div>

      <MechanicsRow
        v-for="(classList, index) in spells.classLists"
        :key="index"
        @remove="removeClassList(index)"
      >
        <UFormField :label="MECHANICS_TEXT.requiredLevel">
          <UInputNumber
            v-model="classList.requiredLevel"
            :min="1"
            :max="MECHANICS_LIMIT.level"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.level">
          <UInputNumber
            v-model="classList.level"
            :min="0"
            :max="MECHANICS_LIMIT.spellLevel"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.maxLevel">
          <UInputNumber
            v-model="classList.maxLevel"
            :min="0"
            :max="MECHANICS_LIMIT.spellLevel"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.spellcastingAbility">
          <USelectMenu
            v-model="classList.spellcastingAbility"
            :items="abilityItems"
            :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
            :search-input="false"
            value-key="value"
            class="w-full"
            clear
          />
        </UFormField>

        <div class="col-span-full flex flex-wrap gap-x-4 gap-y-2">
          <UCheckbox
            v-model="classList.maxLevelFromSlots"
            :label="MECHANICS_TEXT.maxLevelFromSlots"
          />

          <UCheckbox
            v-model="classList.alwaysPrepared"
            :label="MECHANICS_TEXT.alwaysPrepared"
          />
        </div>

        <MechanicsEntityRefs
          v-model="classList.classes"
          :label="MECHANICS_TEXT.classes"
        />
      </MechanicsRow>
    </div>
  </MechanicsSection>
</template>
