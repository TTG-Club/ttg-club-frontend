<script setup lang="ts">
  import { orderBy, sumBy } from 'lodash-es';
  import { useToast } from 'vue-toastification';

  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import { useDiceRoller } from '@/shared/composable/useDiceRoller';
  import { ToastEventBus } from '@/shared/config';
  import { useUIStore } from '@/shared/stores/UIStore';
  import {
    AbilityKey,
    AbilityName,
    type AbilityRoll,
    AbilityShortName,
  } from '@/shared/types/tools/AbilityCalc';

  import type { SelectOption } from 'naive-ui';

  const toast = useToast(ToastEventBus);
  const uiStore = useUIStore();
  const { isMobile } = storeToRefs(uiStore);
  const style = useCssModule();
  const { smallerOrEqual } = useAppBreakpoints();

  const isLg = smallerOrEqual('lg');

  const model = defineModel<Array<AbilityRoll>>({ default: () => [] });

  const { doRoll, notifyResult } = useDiceRoller();

  interface RandomRoll {
    key: AbilityKey | null;
    value: number | null;
  }

  const rolls = ref<Array<RandomRoll>>(
    Array.from({ length: 6 }, () => ({ key: null, value: null })),
  );

  const sum = computed(() => sumBy(rolls.value, 'value'));

  const isRolled = computed(() => sum.value);

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

  const tryRoll = (silent = false) => {
    try {
      const rolled: Array<RandomRoll> = [];

      for (let i = 0; i < rolls.value.length; i++) {
        const roll = doRoll({
          formula: '4d6kh3',
        });

        if (!isMobile.value) {
          notifyResult({
            roll,
            silent,
            label: `Бросок №${i + 1}`,
            toastOptions: {
              timeout: 5000 + 1000 * i,
            },
          });
        }

        rolled.push({
          value: Number(roll.value),
          key: null,
        });
      }

      rolls.value = orderBy(rolled, ['value'], ['desc']);

      model.value = [];
    } catch (err) {
      toast.error('Произошла какая-то ошибка... попробуй еще раз');
    }
  };

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

  model.value = [];

  onActivated(() => {
    model.value = [];
  });
</script>

<template>
  <n-flex
    :vertical="isLg"
    :wrap="false"
    :size="16"
  >
    <n-flex
      justify="space-between"
      vertical
      :size="16"
    >
      <div :class="$style.sum">Сумма: {{ sum }}</div>

      <n-button
        block
        type="primary"
        @click.left.exact.prevent="tryRoll()"
        @click.left.shift.exact.prevent="tryRoll(true)"
      >
        {{ isRolled ? 'Перебросить' : 'Бросить кубики' }}
      </n-button>
    </n-flex>

    <n-grid
      v-if="rolls.length"
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
            :disabled="!roll.value"
            clearable
            placeholder="Выбери хар-ку"
            @update:value="onSelect($event, index)"
            @clear="onClear(index)"
          />
        </n-input-group>
      </n-grid-item>
    </n-grid>
  </n-flex>
</template>

<style module lang="scss">
  .sum {
    width: 100%;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-table-list);
    border-radius: 8px;
    padding: 0 8px;
    color: var(--text-b-color);
    font-size: var(--main-font-size);
    line-height: calc(var(--main-line-height) - 1px);
  }

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
