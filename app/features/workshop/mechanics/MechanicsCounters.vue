<script setup lang="ts">
  import type { CounterForm } from '../model';

  import { useExpandedItems } from '../composables';
  import { WorkshopCollapsibleItem } from '../form';
  import {
    createCounterForm,
    isAmountRestRule,
    MECHANICS_ICON,
    MECHANICS_LIMIT,
    MECHANICS_REST_MODE_OPTIONS,
    MECHANICS_TEXT,
  } from '../model';
  import MechanicsRow from './MechanicsRow.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /**
   * Ресурсы со счётчиком на листе: максимум формулой или ступенями по
   * уровням, откат на коротком и продолжительном отдыхе. Максимум формулой,
   * потому что у большинства запасов он растёт с бонусом мастерства или
   * уровнем.
   */
  const counters = defineModel<Array<CounterForm>>({ required: true });

  const restModeItems = [...MECHANICS_REST_MODE_OPTIONS];

  const { isExpanded, toggle, expand, drop } = useExpandedItems();

  /** Добавляет ресурс со свободным ключом и сразу раскрывает его. */
  function add(): void {
    const addedIndex = counters.value.length;

    counters.value = [
      ...counters.value,
      createCounterForm(counters.value.map((counter) => counter.key)),
    ];

    expand([addedIndex]);
  }

  /**
   * Убирает ресурс.
   * @param index - номер ресурса
   */
  function remove(index: number): void {
    counters.value = counters.value.filter((_, position) => position !== index);
    drop(index);
  }

  /**
   * Заводит ступень максимума: уровнем позже последней.
   * @param counter - ресурс
   */
  function addScaling(counter: CounterForm): void {
    const last = counter.scaling.at(-1);

    counter.scaling = [
      ...counter.scaling,
      {
        level: Math.min(MECHANICS_LIMIT.level, (last?.level ?? 0) + 1),
        max: (last?.max ?? 0) + 1,
      },
    ];
  }

  /**
   * Убирает ступень максимума.
   * @param counter - ресурс
   * @param index - номер ступени
   */
  function removeScaling(counter: CounterForm, index: number): void {
    counter.scaling = counter.scaling.filter(
      (_, position) => position !== index,
    );
  }

  /**
   * Шапка ресурса: название, иначе ключ.
   * @param counter - ресурс
   */
  function getTitle(counter: CounterForm): string {
    return counter.name || counter.key;
  }
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.counters"
    :hint="MECHANICS_TEXT.countersHint"
    :count="counters.length"
    :add-label="MECHANICS_TEXT.add"
    @add="add"
  >
    <WorkshopCollapsibleItem
      v-for="(counter, index) in counters"
      :key="index"
      :title="getTitle(counter)"
      :is-open="isExpanded(index)"
      :remove-label="MECHANICS_TEXT.remove"
      @toggle="toggle(index)"
      @remove="remove(index)"
    >
      <template #trailing>
        <UBadge
          v-if="counter.max"
          :label="counter.max"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
        />
      </template>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField
          :label="MECHANICS_TEXT.name"
          class="sm:col-span-2"
        >
          <UInput
            v-model="counter.name"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.shortName">
          <UInput
            v-model="counter.shortName"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="MECHANICS_TEXT.key"
          :help="MECHANICS_TEXT.keyHelp"
        >
          <UInput
            v-model="counter.key"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.counterMax">
          <UInput
            v-model="counter.max"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.counterMin">
          <UInputNumber
            v-model="counter.min"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-col justify-end gap-2 sm:col-span-2">
          <UCheckbox
            v-model="counter.showInTable"
            :label="MECHANICS_TEXT.showInTable"
          />

          <UCheckbox
            v-model="counter.startsEmpty"
            :label="MECHANICS_TEXT.startsEmpty"
          />
        </div>

        <UFormField :label="MECHANICS_TEXT.shortRest">
          <USelect
            v-model="counter.shortRest.mode"
            :items="restModeItems"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="isAmountRestRule(counter.shortRest)"
          :label="MECHANICS_TEXT.restAmount"
        >
          <UInputNumber
            v-model="counter.shortRest.amount"
            :min="1"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="MECHANICS_TEXT.longRest">
          <USelect
            v-model="counter.longRest.mode"
            :items="restModeItems"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="isAmountRestRule(counter.longRest)"
          :label="MECHANICS_TEXT.restAmount"
        >
          <UInputNumber
            v-model="counter.longRest.amount"
            :min="1"
            class="w-full"
          />
        </UFormField>

        <div class="col-span-full flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-default">
              {{ MECHANICS_TEXT.scaling }}
            </span>

            <UButton
              :icon="MECHANICS_ICON.add"
              :label="MECHANICS_TEXT.add"
              color="neutral"
              variant="soft"
              size="xs"
              @click.left.exact.prevent="addScaling(counter)"
            />
          </div>

          <MechanicsRow
            v-for="(step, stepIndex) in counter.scaling"
            :key="stepIndex"
            @remove="removeScaling(counter, stepIndex)"
          >
            <UFormField :label="MECHANICS_TEXT.level">
              <UInputNumber
                v-model="step.level"
                :min="1"
                :max="MECHANICS_LIMIT.level"
                class="w-full"
              />
            </UFormField>

            <UFormField :label="MECHANICS_TEXT.counterMax">
              <UInputNumber
                v-model="step.max"
                :min="0"
                class="w-full"
              />
            </UFormField>
          </MechanicsRow>
        </div>
      </div>
    </WorkshopCollapsibleItem>
  </MechanicsSection>
</template>
