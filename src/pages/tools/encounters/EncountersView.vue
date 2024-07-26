<script setup lang="ts">
  import { fromPairs, throttle, toPairs } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import type { TNameValue, TSource } from '@/shared/types/BaseApiFields';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';
  import RawContent from '@/shared/ui/RawContent.vue';
  import RollTable, { type IRollTable } from '@/shared/ui/RollTable.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import type { SelectOption } from 'naive-ui';

  interface EncounterItem {
    tableName: string;
    description: string;
    source: TSource;
  }

  const controller = ref<AbortController>();
  const environments = ref<Array<SelectOption>>([]);
  const levels = ref<Array<SelectOption>>([]);
  const results = ref<Array<EncounterItem>>([]);

  interface TableState {
    show: boolean;
    data?: IRollTable;
  }

  const table = reactive<TableState>({
    show: false,
    data: undefined,
  });

  interface FormPayload {
    level?: number;
    environment?: string;
  }

  const form = reactive<FormPayload>({
    level: undefined,
    environment: undefined,
  });

  interface GetOptionsResponse {
    environments: Array<TNameValue>;
    levels: Array<TNameValue<number>>;
  }

  const getOptions = async () => {
    try {
      const resp = await httpClient.get<GetOptionsResponse>({
        url: '/tools/encounters',
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      environments.value = resp.data.environments.map((env) => ({
        label: env.name,
        value: env.value,
      }));

      levels.value = resp.data.levels.map((level) => ({
        label: level.name,
        value: level.value,
      }));
    } catch (err) {
      errorHandler(err);
    }
  };

  const sendForm = throttle(async () => {
    if (controller.value) {
      controller.value.abort();
    }

    controller.value = new AbortController();

    try {
      const options: Partial<FormPayload> = fromPairs(
        toPairs(form).filter(([key, value]) => key && !!value),
      );

      const resp = await httpClient.post<EncounterItem>({
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
    if (controller.value) {
      controller.value.abort();
    }

    controller.value = new AbortController();

    try {
      const resp = await httpClient.post<IRollTable>({
        url: '/tools/encounters/table',
        payload: form,
        signal: controller.value.signal,
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      table.data = resp.data;
      table.show = true;
    } catch (err) {
      errorHandler(err);
    } finally {
      controller.value = undefined;
    }
  };

  getOptions();

  const isTableDisabled = computed(() => {
    return form.level && form.environment;
  });
</script>

<template>
  <content-layout>
    <template #fixed>
      <n-form
        class="tools_settings"
        @submit.prevent.stop="sendForm"
        @keyup.enter.exact.prevent.stop="sendForm"
      >
        <n-flex>
          <n-form-item
            label="Средний уровень Группы"
            :style="{ minWidth: '254px' }"
          >
            <n-select
              v-model:value="form.level"
              :options="levels"
              placeholder="Уровень"
            />
          </n-form-item>

          <n-form-item
            label="Окружение"
            :style="{ minWidth: '254px' }"
          >
            <n-select
              v-model:value="form.environment"
              :options="environments"
              placeholder="Окружение"
            />
          </n-form-item>
        </n-flex>

        <n-flex>
          <n-button
            type="primary"
            attr-type="submit"
          >
            Сгенерировать
          </n-button>

          <n-button
            secondary
            @click.left.exact.prevent="results = []"
          >
            Очистить
          </n-button>

          <n-button
            v-if="isTableDisabled"
            secondary
            @click.left.exact.prevent="getTable"
          >
            Показать таблицу
          </n-button>
        </n-flex>
      </n-form>
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

    :deep(p) {
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
</style>
