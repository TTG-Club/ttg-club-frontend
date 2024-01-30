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
          v-model="form.hits.dice"
          label="label"
          track-by="value"
          :options="[]"
          required
        >
          <template #label>Кость хитов</template>
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
  import { reactive } from 'vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import { referenceService } from '@/shared/api/referenceService';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
  import UiSelect from '@/shared/ui/kit/UiSelect.vue';

  const form = reactive({
    name: {
      rus: '',
      eng: ''
    },
    hits: {
      dice: null,
      count: '',
      bonus: ''
    }
  });

  Promise.all([
    referenceService.getSizes(),
    referenceService.getEnvironments(),
    referenceService.getDices(),
    referenceService.getDamageTypes(),
    referenceService.getConditions(),
    referenceService.getBeastTypes(),
    referenceService.getArmorTypes(),
    referenceService.getAlignments()
  ]).then(references => {
    console.log(references);
  });
</script>

<style module lang="scss">
  .creature {
    display: grid;
    gap: 12px 12px;
    grid-template-columns: repeat(3, 1fr);
  }

  .row {
    display: flex;
    gap: 12px;

    & > * {
      flex: 1 1 auto;
    }
  }
</style>
