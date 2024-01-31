<script setup lang="ts">
  import { refAutoReset } from '@vueuse/core';
  import { toNumber } from 'lodash-es';
  import { storeToRefs } from 'pinia';
  import { ref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useUIStore } from '@/shared/stores/UIStore';
  import DiceRoller from '@/shared/ui/DiceRoller.vue';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import RawContent from '@/shared/ui/RawContent.vue';

  import type { RollBase } from 'dice-roller-parser';

  export interface IRollTable {
    name: string;
    formula: string;
    thead: Array<string>;
    tbody: Array<Array<string>>;
  }

  const props = defineProps<{
    table: IRollTable;
  }>();

  const toast = useToast(ToastEventBus);
  const { isMobile } = storeToRefs(useUIStore());

  const tableRow = ref<HTMLTableRowElement | Array<HTMLTableRowElement>>();
  const highlighted = refAutoReset(-1, 5 * 1000);

  const showResult = (result: RollBase['value']) => {
    const { tbody } = props.table;

    const index = tbody.findIndex(row => {
      const results = row[0];

      if (!results.includes('-')) {
        return result === toNumber(results);
      }

      const [min, max] = results.split('-').map(item => toNumber(item));

      return min <= result && result <= max;
    });

    if (index === -1) {
      toast.error('Произошла ошибка, попробуйте еще раз...');

      return;
    }

    highlighted.value = index;

    if (
      isMobile.value &&
      tableRow.value instanceof Array &&
      tableRow.value[index]
    ) {
      const el = tableRow.value[index];

      el.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  };
</script>

<template>
  <table :class="$style.rollTable">
    <thead>
      <th>
        <dice-roller
          :formula="table.formula"
          @roll-result="showResult"
        />
      </th>

      <th
        v-for="(th, key) in table.thead"
        :key="key"
      >
        <raw-content
          :template="th"
          tag="span"
        />
      </th>
    </thead>

    <tr
      v-for="(tr, rowIndex) in table.tbody"
      :key="rowIndex"
      ref="tableRow"
      :class="{ [$style.highlighted]: rowIndex === highlighted }"
    >
      <component
        :is="!cellIndex ? 'th' : 'td'"
        v-for="(td, cellIndex) in tr"
        :key="cellIndex"
      >
        <transition
          name="fade"
          mode="out-in"
        >
          <span
            v-if="!cellIndex && rowIndex === highlighted"
            :class="$style.dice"
          >
            <svg-icon
              icon="dice/d20"
              size="18"
            />
          </span>

          <raw-content
            v-else
            :template="td"
            tag="span"
          />
        </transition>
      </component>
    </tr>
  </table>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/mixins' as *;

  .rollTable {
    table-layout: auto;
    width: 100%;

    tr {
      @include css_anim();
    }

    th {
      white-space: nowrap;
    }

    th,
    td {
      padding: 8px 12px;
    }
  }

  .highlighted {
    background-color: var(--bg-table-row-highlighted) !important;
  }

  .dice {
    display: flex;
    justify-content: center;
  }
</style>
