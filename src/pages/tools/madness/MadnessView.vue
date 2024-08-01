<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api/index.js';
  import type { TNameValue } from '@/shared/types/BaseApiFields';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  interface MadnessType extends TNameValue {
    checked: boolean;
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

  interface MadnessRequestPayload {
    count: number;
    type?: string;
    sources?: Array<string>;
  }

  const count = ref(1);
  const types = ref<Array<MadnessType>>([]);
  const results = ref<Array<MadnessItem>>([]);
  const controller = ref<AbortController>();

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
        checked: false,
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
      const options: MadnessRequestPayload = {
        count: count.value || 1,
      };

      const type = types.value.find((el) => el.checked);

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
        types.value[i].checked = false;

        continue;
      }

      types.value[i].checked = e;
    }
  };

  getTables();
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
            label="Количество"
            :style="{ minWidth: '254px' }"
          >
            <n-input-number v-model:value="count" />
          </n-form-item>

          <n-form-item
            label="Вид безумия"
            :style="{ minWidth: '254px' }"
          >
            <n-flex>
              <n-tag
                v-for="(type, key) in types"
                :key="key"
                :checked="type.checked"
                checkable
                round
                @click.left.exact.prevent="toggleType(!type.checked, type)"
              >
                {{ type.name }}
              </n-tag>
            </n-flex>
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
        </n-flex>
      </n-form>
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
    overflow: hidden;
    display: block;

    width: 100%;
    margin-bottom: 12px;
    padding: 12px;

    background-color: var(--bg-table-list);
    border-radius: 12px;

    :deep(p) {
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
</style>
