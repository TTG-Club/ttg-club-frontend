<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  type TavernResult = {
    name: string;
    atmosphere: string;
  };

  const tavernTypes = [
    {
      label: 'Случайный тип',
      value: null,
    },
    {
      label: 'Пивная, кабак, бар',
      value: 'BEER',
    },
    {
      label: 'Постоялый двор, трактир, таверна',
      value: 'INN',
    },
    {
      label: 'Гостиница, отель',
      value: 'HOTEL',
    },
  ];

  const tavernaType = ref<string | null>(null);
  const results = ref<Array<TavernResult>>([]);
  const controller = ref<AbortController>();

  const generateTavern = throttle(async () => {
    if (controller.value) {
      controller.value.abort();
    }

    controller.value = new AbortController();

    try {
      const [nameResp, atmosphereResp] = await Promise.all([
        httpClient.rawGet({
          url: '/tools/tavern/name',
          payload: tavernaType.value
            ? {
                tavernaType: tavernaType.value,
              }
            : undefined,
          signal: controller.value.signal,
        }),
        httpClient.rawGet({
          url: '/tools/tavern/atmosphere/',
          signal: controller.value.signal,
        }),
      ]);

      if (nameResp.status !== 200) {
        errorHandler(nameResp.statusText);

        return;
      }

      if (atmosphereResp.status !== 200) {
        errorHandler(atmosphereResp.statusText);

        return;
      }

      results.value.unshift({
        name: nameResp.data,
        atmosphere: atmosphereResp.data,
      });
    } catch (err) {
      errorHandler(err);
    } finally {
      controller.value = undefined;
    }
  }, 300);
</script>

<template>
  <content-layout title="Таверна">
    <template #fixed>
      <n-form
        class="tools_settings"
        @submit.prevent.stop="generateTavern"
        @keyup.enter.exact.prevent.stop="generateTavern"
      >
        <n-flex>
          <n-form-item
            label="Тип заведения"
            :style="{ minWidth: '254px' }"
          >
            <n-select
              v-model:value="tavernaType"
              :options="tavernTypes"
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
        </n-flex>
      </n-form>
    </template>

    <template #default>
      <div
        v-if="!results.length"
        class="tavern-empty"
      >
        Выберите тип заведения и сгенерируйте таверну.
      </div>

      <div
        v-for="(item, key) in results"
        :key="key"
        class="tavern-item"
      >
        <div class="tavern-item__name">
          {{ item.name }}
        </div>

        <raw-content :template="item.atmosphere" />
      </div>
    </template>
  </content-layout>
</template>

<style lang="scss" scoped>
  .tavern-empty,
  .tavern-item {
    width: 100%;
    margin-bottom: 12px;
    padding: 12px;

    background-color: var(--bg-table-list);
    border-radius: 12px;
  }

  .tavern-empty {
    color: var(--text-g-color);
  }

  .tavern-item {
    overflow: hidden;

    &__name {
      margin-bottom: 12px;
      font-size: var(--h4-font-size);
      font-weight: 600;
      line-height: var(--h4-line-height);
    }

    :deep(p) {
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
</style>
