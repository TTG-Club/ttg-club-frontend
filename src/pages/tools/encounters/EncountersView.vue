<script setup lang="ts">
  import { throttle } from 'lodash-es';
  import { computed, onBeforeMount, reactive, ref } from 'vue';

  import { httpClient } from '@/shared/api';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiMultiselect from '@/shared/ui/kit/UiMultiselect.vue';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';
  import RawContent from '@/shared/ui/RawContent.vue';
  import RollTable from '@/shared/ui/RollTable.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import type { AxiosResponse } from 'axios';

  type IOption = { name: string; value: number | string };

  const controller = ref<AbortController>();

  const environments = ref<IOption[]>([]);
  const levels = ref<IOption[]>([]);
  const level = ref<IOption>();
  const environment = ref<IOption>();

  const results = ref([]);

  const table = ref({
    show: false,
    data: undefined,
  });

  const form = ref({
    level: 0,
    environment: '',
  });

  const isTableDisabled = computed(
    () => form.value.level && form.value.environment,
  );

  const getOptions = async () => {
    try {
      const resp: AxiosResponse = await httpClient.get({
        url: '/tools/encounters',
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      environments.value = resp.data.environments;
      levels.value = resp.data.levels;
    } catch (err) {
      errorHandler(err);
    }
  };

  onBeforeMount(() => getOptions());

  const sendForm = throttle(async () => {
    if (controller.value) controller.value.abort();

    controller.value = new AbortController();

    try {
      const options = {};

      for (const [key, value] of Object.entries(form.value)) {
        if (!value) continue;

        options[key] = value;
      }

      const resp: AxiosResponse = await httpClient.post({
        url: '/tools/encounters',
        payload: options,
        signal: controller.value.signal,
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      results.value.unshift(reactive(resp.data));
    } catch (err) {
      errorHandler(err);
    } finally {
      controller.value = undefined;
    }
  }, 300);

  const getTable = async () => {
    if (controller.value) controller.value.abort();

    controller.value = new AbortController();

    try {
      const resp = await httpClient.post({
        url: '/tools/encounters/table',
        payload: form.value,
        signal: controller.value.signal,
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      table.value = {
        show: true,
        data: resp.data,
      };
    } catch (err) {
      errorHandler(err);
    } finally {
      controller.value = undefined;
    }
  };
</script>

<template>
  <content-layout>
    <template #fixed>
      <form
        class="tools_settings"
        @submit.prevent="sendForm"
      >
        <div class="tools_settings__row">
          <div class="tools_settings__column">
            <ui-multiselect
              v-model="level"
              :options="levels"
              label="name"
              track-by="value"
              header-label="Средний уровень Группы"
              placeholder="Уровень"
              @update:model-value="form.level = $event.value"
            />

            <ui-multiselect
              v-model="environment"
              :options="environments"
              label="name"
              track-by="value"
              header-label="Окружение"
              placeholder="Окружение"
            />
          </div>
        </div>

        <div class="tools_settings__row btn-wrapper">
          <ui-button @click.left.exact.prevent="sendForm">
            Сгенерировать
          </ui-button>

          <ui-button @click.left.exact.prevent="results = []">
            Очистить
          </ui-button>

          <ui-button
            v-if="isTableDisabled"
            @click.left.exact.prevent="getTable"
          >
            Показать таблицу
          </ui-button>
        </div>
      </form>
    </template>

    <template #default>
      <div
        v-for="(item, key) in results"
        :key="key"
        class="madness-item"
      >
        <div><b>Источник:</b> {{ item.source.name }}</div>

        <div><b>Таблица:</b> {{ item.tableName }}</div>

        <br />

        <div>
          <raw-content :template="item.description" />
        </div>
      </div>
    </template>
  </content-layout>

  <base-modal
    v-if="table.data"
    v-model="table.show"
  >
    <template #title>
      {{ table.data.name }}
    </template>

    <template #default>
      <div class="content-padding">
        <roll-table :table="table.data" />
      </div>
    </template>
  </base-modal>
</template>

<style lang="scss" scoped>
  .madness-item {
    border-radius: 12px;
    overflow: hidden;
    background-color: var(--bg-table-list);
    width: 100%;
    display: block;
    margin-bottom: 12px;
    padding: 12px;
  }
</style>
