<template>
  <table class="roll-table">
    <thead>
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
      v-for="(tr, key) in table.tbody"
      :key="key"
    >
      <component
        :is="!index ? 'th' : 'td'"
        v-for="(td, index) in tr"
        :key="index"
      >
        <raw-content
          :template="td"
          tag="span"
        />
      </component>
    </tr>
  </table>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';

  import RawContent from '@/shared/ui/RawContent.vue';

  export default defineComponent({
    name: 'RollTable',
    components: { RawContent },
    props: {
      table: {
        type: Object,
        default: undefined,
        required: true
      }
    }
  });
</script>

<style lang="scss" scoped>
  .roll-table {
    table-layout: auto;
    width: 100%;

    th {
      white-space: nowrap;
    }

    th,
    td {
      padding: 8px 12px;
    }
  }
</style>
