<script setup lang="ts">
  import { computed, onActivated, ref } from 'vue';

  import type { AbilityRoll } from '@/shared/types/tools/AbilityCalc.d';
  import { AbilityKey, AbilityName } from '@/shared/types/tools/AbilityCalc.d';
  import UiMultiselect from '@/shared/ui/kit/UiMultiselect.vue';

  import type { PropType } from 'vue';

  const modelValue = defineModel({
    type: Array as PropType<Array<AbilityRoll>>,
    required: true,
  });

  const selectedOptions = ref<Array<AbilityRoll | null>>([]);

  const rolls = ref<Array<AbilityRoll>>([
    {
      name: null,
      key: null,
      shortName: null,
      value: 15,
    },
    {
      name: null,
      key: null,
      shortName: null,
      value: 14,
    },
    {
      name: null,
      key: null,
      shortName: null,
      value: 13,
    },
    {
      name: null,
      key: null,
      shortName: null,
      value: 12,
    },
    {
      name: null,
      key: null,
      shortName: null,
      value: 10,
    },
    {
      name: null,
      key: null,
      shortName: null,
      value: 8,
    },
  ]);

  modelValue.value = rolls.value;

  onActivated(() => {
    modelValue.value = rolls.value;
  });

  const isSelected = (key: AbilityKey) =>
    rolls.value.find((roll) => roll.key === key);

  const onSelect = (key: AbilityKey | null, index: number) => {
    const setValue = (value: typeof key, i: number) => {
      rolls.value[i].key = value;

      rolls.value[i].name = value ? AbilityName[value] : null;
    };

    for (let i = 0; i < rolls.value.length; i++) {
      if (i === index) {
        setValue(key, i);

        continue;
      }

      if (rolls.value[i].key === key) {
        setValue(null, i);
      }
    }

    modelValue.value = rolls.value;

    const selectedOption = selectedOptions.value[index];

    selectedOptions.value.forEach((el, i) => {
      if (el === selectedOption && index !== i) selectedOptions.value[i] = null;
    });
  };

  const abilities = computed(() =>
    Object.keys(AbilityKey).map((key) => ({
      key,
      name: AbilityName[key as AbilityKey],
    })),
  );
</script>

<template>
  <div
    v-if="modelValue.length"
    class="ability-array"
  >
    <ui-multiselect
      v-for="(roll, i) in rolls"
      :key="i"
      v-model="selectedOptions[i]"
      :options="abilities"
      class="ability-array__select"
      label="name"
      track-by="key"
      placeholder="Выбрать хар-ку"
      @update:model-value="onSelect($event.key, i)"
    >
      <template #left-slot>
        {{ roll.value }}
      </template>

      <template #option="{ name, key }">
        <span
          :class="{ 'is-selected': isSelected(key) }"
          class="ability-array__select_option"
          >{{ name }}</span
        >
      </template>
    </ui-multiselect>
  </div>
</template>

<style lang="scss" scoped>
  .ability-array {
    flex: 1 1 auto;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr 1fr 1fr;

    &__select {
      :deep(.multiselect__option) {
        padding: 0;
      }

      &_placeholder {
        display: flex;
      }

      &_option {
        position: relative;

        &.is-selected {
          &::before {
            content: '';
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--primary);
            position: absolute;
            top: calc(50% - 5px);
            left: -20px;
          }
        }
      }

      &_roll {
      }
    }

    .ability-table {
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
    }
  }
</style>
