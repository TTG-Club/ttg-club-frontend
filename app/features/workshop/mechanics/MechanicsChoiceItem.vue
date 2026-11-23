<script setup lang="ts">
  import type { ChoiceForm } from '../model';

  import {
    hasSpellFilter,
    MECHANICS_CASTING_UNIT_OPTIONS,
    MECHANICS_CHOICE_GRANT_OPTIONS,
    MECHANICS_CHOICE_PRESETS,
    MECHANICS_CHOICE_TYPE_OPTIONS,
    MECHANICS_ICON,
    MECHANICS_LIMIT,
    MECHANICS_TEXT,
    SPELL_SCHOOL_OPTIONS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';
  import MechanicsEntityRefs from './MechanicsEntityRefs.vue';
  import MechanicsRow from './MechanicsRow.vue';

  /**
   * Один выбор игрока: что выбирают, сколько и из чего, что выбор даёт, как
   * количество растёт с уровнем. Фильтр заклинаний — только у выбора
   * заклинаний и заговоров.
   */
  const choice = defineModel<ChoiceForm>({ required: true });

  const typeItems = [...MECHANICS_CHOICE_TYPE_OPTIONS];
  const grantItems = [...MECHANICS_CHOICE_GRANT_OPTIONS];
  const schoolItems = [...SPELL_SCHOOL_OPTIONS];
  const castingTimeItems = [...MECHANICS_CASTING_UNIT_OPTIONS];

  const isSpellChoice = computed(() => hasSpellFilter(choice.value));

  /**
   * Готовые варианты по основному виду выбора, кроме уже добавленных: из них
   * вариант добавляется одним выбором вместо ручного ввода кода.
   */
  const presetItems = computed(() => {
    const [type] = choice.value.types;
    const presets = type ? (MECHANICS_CHOICE_PRESETS[type] ?? []) : [];
    const used = new Set(choice.value.options.map((option) => option.value));

    return presets.filter((preset) => !used.has(preset.value));
  });

  /**
   * Добавляет готовый вариант: код и подпись из списка.
   * @param value - код варианта
   */
  function addPreset(value: string | undefined): void {
    const preset = presetItems.value.find((item) => item.value === value);

    if (preset) {
      choice.value.options = [
        ...choice.value.options,
        { value: preset.value, name: preset.label },
      ];
    }
  }

  function addOption(): void {
    choice.value.options = [...choice.value.options, { value: '', name: '' }];
  }

  /**
   * Убирает вариант.
   * @param index - номер варианта
   */
  function removeOption(index: number): void {
    choice.value.options = choice.value.options.filter(
      (_, position) => position !== index,
    );
  }

  /** Новая ступень начинается уровнем позже последней и даёт на одно больше. */
  function addScaling(): void {
    const last = choice.value.scaling.at(-1);

    choice.value.scaling = [
      ...choice.value.scaling,
      {
        level: Math.min(MECHANICS_LIMIT.level, (last?.level ?? 0) + 1),
        count: (last?.count ?? choice.value.count ?? 1) + 1,
      },
    ];
  }

  /**
   * Убирает ступень.
   * @param index - номер ступени
   */
  function removeScaling(index: number): void {
    choice.value.scaling = choice.value.scaling.filter(
      (_, position) => position !== index,
    );
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <UFormField
      :label="MECHANICS_TEXT.key"
      :help="MECHANICS_TEXT.keyHelp"
    >
      <UInput
        v-model="choice.key"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="MECHANICS_TEXT.choiceTypes"
      :help="MECHANICS_TEXT.choiceTypesHelp"
      class="sm:col-span-1 lg:col-span-2"
    >
      <USelectMenu
        v-model="choice.types"
        :items="typeItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        value-key="value"
        class="w-full"
        multiple
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.grants">
      <USelectMenu
        v-model="choice.grants"
        :items="grantItems"
        :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
        :search-input="false"
        value-key="value"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      :label="MECHANICS_TEXT.label"
      class="sm:col-span-2"
    >
      <UInput
        v-model="choice.label"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.count">
      <UInputNumber
        v-model="choice.count"
        :min="1"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.requiredLevel">
      <UInputNumber
        v-model="choice.requiredLevel"
        :min="1"
        :max="MECHANICS_LIMIT.level"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="MECHANICS_TEXT.shortName">
      <UInput
        v-model="choice.shortName"
        class="w-full"
      />
    </UFormField>

    <div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
      <UCheckbox
        v-model="choice.countEqualsProficiencyBonus"
        :label="MECHANICS_TEXT.countEqualsProficiencyBonus"
      />

      <UCheckbox
        v-model="choice.onlyIfNotProficient"
        :label="MECHANICS_TEXT.onlyIfNotProficient"
      />

      <UCheckbox
        v-model="choice.onlyIfProficient"
        :label="MECHANICS_TEXT.onlyIfProficient"
      />

      <UCheckbox
        v-model="choice.expertiseIfProficient"
        :label="MECHANICS_TEXT.expertiseIfProficient"
      />

      <UCheckbox
        v-model="choice.rechooseOnLongRest"
        :label="MECHANICS_TEXT.rechooseOnLongRest"
      />

      <UCheckbox
        v-model="choice.showInTable"
        :label="MECHANICS_TEXT.showInTable"
      />

      <UCheckbox
        v-if="isSpellChoice"
        v-model="choice.alwaysPrepared"
        :label="MECHANICS_TEXT.alwaysPrepared"
      />
    </div>

    <!-- Варианты -->
    <div class="col-span-full flex flex-col gap-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-col">
          <span class="text-sm text-default">{{ MECHANICS_TEXT.options }}</span>

          <span class="text-xs text-muted">
            {{ MECHANICS_TEXT.optionsHint }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <USelectMenu
            v-if="presetItems.length"
            :model-value="undefined"
            :items="presetItems"
            :placeholder="MECHANICS_TEXT.addPreset"
            value-key="value"
            size="xs"
            class="w-48"
            @update:model-value="addPreset"
          />

          <UButton
            :icon="MECHANICS_ICON.add"
            :label="MECHANICS_TEXT.add"
            color="neutral"
            variant="soft"
            size="xs"
            @click.left.exact.prevent="addOption"
          />
        </div>
      </div>

      <MechanicsRow
        v-for="(option, index) in choice.options"
        :key="index"
        @remove="removeOption(index)"
      >
        <UFormField
          :label="MECHANICS_TEXT.optionValue"
          class="lg:col-span-2"
        >
          <UInput
            v-model="option.value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="MECHANICS_TEXT.name"
          class="lg:col-span-2"
        >
          <UInput
            v-model="option.name"
            class="w-full"
          />
        </UFormField>
      </MechanicsRow>
    </div>

    <!-- Ступени количества -->
    <div class="col-span-full flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm text-default">{{ MECHANICS_TEXT.scaling }}</span>

        <UButton
          :icon="MECHANICS_ICON.add"
          :label="MECHANICS_TEXT.add"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addScaling"
        />
      </div>

      <MechanicsRow
        v-for="(step, index) in choice.scaling"
        :key="index"
        @remove="removeScaling(index)"
      >
        <UFormField :label="MECHANICS_TEXT.level">
          <UInputNumber
            v-model="step.level"
            :min="1"
            :max="MECHANICS_LIMIT.level"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.count">
          <UInputNumber
            v-model="step.count"
            :min="1"
            class="w-full"
          />
        </UFormField>
      </MechanicsRow>
    </div>

    <!-- Фильтр заклинаний -->
    <div
      v-if="isSpellChoice"
      class="col-span-full grid grid-cols-1 gap-3 rounded-lg border border-default p-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      <span class="col-span-full text-sm text-default">
        {{ MECHANICS_TEXT.spellFilter }}
      </span>

      <UFormField :label="MECHANICS_TEXT.level">
        <UInputNumber
          v-model="choice.spellFilter.level"
          :min="0"
          :max="MECHANICS_LIMIT.spellLevel"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.maxLevel">
        <UInputNumber
          v-model="choice.spellFilter.maxLevel"
          :min="0"
          :max="MECHANICS_LIMIT.spellLevel"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.castingTime">
        <USelectMenu
          v-model="choice.spellFilter.castingTime"
          :items="castingTimeItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          clear
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.classesFromChoiceKey">
        <UInput
          v-model="choice.spellFilter.classesFromChoiceKey"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.schools"
        class="col-span-full"
      >
        <USelectMenu
          v-model="choice.spellFilter.schools"
          :items="schoolItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <MechanicsEntityRefs
        v-model="choice.spellFilter.classes"
        :label="MECHANICS_TEXT.classes"
      />
    </div>
  </div>
</template>
