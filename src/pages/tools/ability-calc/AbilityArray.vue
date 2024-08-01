<script setup lang="ts">
  import {
    type AbilityRoll,
    AbilityKey,
    AbilityName,
    AbilityShortName,
  } from '@/shared/types/tools/AbilityCalc';

  import type { SelectOption } from 'naive-ui';

  const style = useCssModule();

  const model = defineModel<Array<AbilityRoll>>({ default: () => [] });

  interface AbilityArrayRoll {
    key: AbilityKey | null;
    value: number;
  }

  const rolls = ref<Array<AbilityArrayRoll>>(
    [15, 14, 13, 12, 10, 8].map((value) => ({
      key: null,
      value,
    })),
  );

  const isSelected = (key: AbilityKey) =>
    rolls.value.find((roll) => roll.key === key);

  const abilities = computed<Array<SelectOption>>(() => {
    const keys: Array<AbilityKey> = Object.values(AbilityKey);

    return keys.map<SelectOption>((key) => ({
      value: key,
      label: AbilityName[key],
      class: isSelected(key) ? style.dotted : undefined,
    }));
  });

  const emit = () => {
    const res: Array<AbilityRoll> = [];

    for (const { key, value } of rolls.value) {
      if (!key || !value) {
        continue;
      }

      res.push({
        key,
        value,
        name: AbilityName[key],
        shortName: AbilityShortName[key],
      });
    }

    model.value = res;
  };

  const onSelect = (key: AbilityKey | null, index: number) => {
    rolls.value[index].key = key;

    for (let i = 0; i < rolls.value.length; i++) {
      if (i === index || rolls.value[i].key !== key) {
        continue;
      }

      rolls.value[i].key = null;
    }

    emit();
  };

  const onClear = (index: number) => {
    rolls.value[index].key = null;

    emit();
  };

  emit();

  onActivated(() => {
    emit();
  });
</script>

<template>
  <n-grid
    cols="1 672:3"
    x-gap="16"
    y-gap="16"
  >
    <n-grid-item
      v-for="(roll, index) in rolls"
      :key="index"
    >
      <n-input-group>
        <transition
          name="fade"
          mode="out-in"
          appear
        >
          <n-input-group-label
            v-if="roll.value"
            :style="{ width: '40px', textAlign: 'center' }"
          >
            {{ roll.value }}
          </n-input-group-label>
        </transition>

        <n-select
          :value="roll.key"
          :options="abilities"
          :show-checkmark="false"
          clearable
          placeholder="Выбери хар-ку"
          @update:value="onSelect($event, index)"
          @clear="onClear(index)"
        />
      </n-input-group>
    </n-grid-item>
  </n-grid>
</template>

<style module lang="scss">
  .dotted {
    flex-direction: row-reverse;
    justify-content: flex-end;

    &:after {
      content: '';
      display: block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--primary);
      margin-right: 8px;
    }
  }
</style>
