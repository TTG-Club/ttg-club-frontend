<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api/index.js';
  import type { TNameValue } from '@/shared/types/BaseApiFields';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  interface MadnessType extends TNameValue {
    toggled: boolean;
  }

  interface MadnessItemType {
    key: string;
    name: string;
    shortName: string;
    value: number;
    additional: string;
  }

  interface MadnessItem {
    description: string;
    type: MadnessItemType;
  }

  const count = ref(1);
  const types = ref<Array<MadnessType>>([]);
  const results = ref<Array<MadnessItem>>([]);
  const controller = ref<AbortController>();

  interface MadnessRequestPayload {
    count: number;
    type?: string;
    sources?: Array<string>;
  }

  const getTables = async () => {
    try {
      const resp = await httpClient.get<Array<TNameValue>>({
        url: '/tools/madness',
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      types.value = resp.data.map((type) => ({
        ...type,
        toggled: false,
      }));
    } catch (err) {
      errorHandler(err);
    }
  };

  // eslint-disable-next-line func-names
  const sendForm = throttle(async function () {
    if (controller.value) {
      controller.value.abort();
    }

    controller.value = new AbortController();

    try {
      const options: MadnessRequestPayload = {
        count: count.value || 1,
      };

      const type = types.value.find((el) => el.toggled);

      if (type) {
        options.type = type.value;
      }

      const resp = await httpClient.post<Array<MadnessItem>>({
        url: '/tools/madness',
        payload: options,
        signal: controller.value.signal,
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      for (const el of resp.data) {
        results.value.unshift(reactive(el));
      }
    } catch (err) {
      errorHandler(err);
    } finally {
      controller.value = undefined;
    }
  }, 300);

  const toggleType = (e: boolean, type: MadnessType) => {
    for (let i = 0; i < types.value.length; i++) {
      if (types.value[i].value !== type.value) {
        types.value[i].toggled = false;

        continue;
      }

      types.value[i].toggled = e;
    }
  };

  getTables();
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
            <div class="row">
              <span class="label">Количество:</span>

              <ui-input
                v-model="count"
                class="form-control select"
                type="number"
                placeholder="Количество"
                :min="1"
              />
            </div>

            <div class="row">
              <span class="label">Виды безумия:</span>

              <div class="checkbox-group">
                <ui-checkbox
                  v-for="(type, key) in types"
                  :key="key"
                  :model-value="type.toggled"
                  type="crumb"
                  @update:model-value="toggleType($event, type)"
                >
                  {{ type.name }}
                </ui-checkbox>
              </div>
            </div>
          </div>
        </div>

        <div class="tools_settings__row btn-wrapper">
          <ui-button @click.left.exact.prevent="sendForm">
            Сгенерировать
          </ui-button>

          <ui-button @click.left.exact.prevent="results = []">
            Очистить
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
        <div><b>Тип:</b> {{ item.type.name }}</div>

        <div><b>Длительность:</b> {{ item.type.additional }}</div>

        <br />

        <div>
          <raw-content :template="item.description" />
        </div>
      </div>
    </template>
  </content-layout>
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
