<template>
  <page-layout :use-social-links="false">
    <template #title> Создание существа </template>

    <template #default>
      <form
        :class="$style.creature"
        @submit.prevent
      >
        <ui-input
          v-model="form.name.rus"
          label="Название существа"
          required
        />

        <ui-input
          v-model="form.name.eng"
          label="Название существа (на английском)"
          required
        />

        <ui-select
          required
          :options="[]"
        >
          <template #label> Размер </template>
        </ui-select>

        <ui-select
          required
          :options="[]"
        >
          <template #label> Тип </template>
        </ui-select>

        <ui-select :options="[]">
          <template #label> Мировоззрение </template>
        </ui-select>

        <ui-input
          v-model="form.name.rus"
          label="КД"
          type="number"
          required
        />

        <ui-input
          v-model="form.name.eng"
          label="Броня"
        />

        <ui-input
          v-model="form.name.eng"
          label="Колчиство кубов"
          type="number"
          required
        />

        <ui-select
          v-model="hitDice"
          label="label"
          track-by="value"
          :options="dices"
          required
        >
          <template #label>Куб хитов</template>
        </ui-select>

        <ui-input
          v-model="form.name.eng"
          label="Бонусные хиты"
          type="number"
        />

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>

        <div :class="$style.row">йцукен</div>
      </form>
    </template>
  </page-layout>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import UiInput from '@/shared/ui/kit/UiInput.vue';
  import UiSelect from '@/shared/ui/kit/UiSelect.vue';

  const dices = [
    { label: 'к4', value: 4 },
    { label: 'к6', value: 6 },
    { label: 'к8', value: 8 },
    { label: 'к10', value: 10 },
    { label: 'к12', value: 12 },
    { label: 'к20', value: 20 }
  ];

  const form = reactive({
    name: {
      rus: '',
      eng: ''
    },
    hits: {
      dice: 'к4',
      count: '1',
      bonus: 300
    }
  });

  const hitDice = computed({
    get: () => dices.find(dice => dice.value === form.hits.dice),
    set: (v: { label: string; value: number }) => (form.hits.dice = v.value)
  });
</script>

<style module lang="scss">
  .creature {
    display: grid;
    gap: 12px 12px;
  }

  .row {
    display: flex;
    gap: 12px;

    & > * {
      flex: 1 1 auto;
    }
  }
</style>
