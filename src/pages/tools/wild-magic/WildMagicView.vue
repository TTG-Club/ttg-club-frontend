<script setup lang="ts">
  import { throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import type { TSource } from '@/shared/types/BaseApiFields';
  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  interface WildMagicSource extends TSource {
    checked: boolean;
  }

  interface WildMagicItem {
    description: string;
    source: TSource;
  }

  const count = ref(1);
  const sources = ref<Array<WildMagicSource>>([]);
  const results = ref<Array<WildMagicItem>>([]);
  const controller = ref<AbortController>();

  const resetSourceValue = () => {
    const phbSourceIndex = sources.value.findIndex(
      (source) => source.shortName === 'PHB',
    );

    if (phbSourceIndex < 0) {
      sources.value[0].checked = true;
    }

    sources.value[phbSourceIndex].checked = true;
  };

  const onSourceCheckedUpdate = (
    name: WildMagicSource['shortName'],
    value: WildMagicSource['checked'],
  ) => {
    const index = sources.value.findIndex(
      (source) => source.shortName === name,
    );

    if (index < 0) {
      return;
    }

    const checkedCount = sources.value.filter(
      (source) => source.shortName !== name && source.checked,
    ).length;

    if (checkedCount > 0 || value) {
      sources.value[index].checked = value;
    }
  };

  const getTables = async () => {
    try {
      const resp = await httpClient.get<Array<TSource>>({
        url: '/tools/wildmagic',
      });

      if (resp.status !== 200) {
        errorHandler(resp.statusText);

        return;
      }

      sources.value = resp.data.reverse().map((source) => ({
        ...source,
        checked: false,
      }));

      resetSourceValue();
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
      const options = {
        count: count.value || 1,
        sources: sources.value
          .filter((source) => source.checked)
          .map((source) => source.shortName),
      };

      const resp = await httpClient.post<Array<WildMagicItem>>({
        url: '/tools/wildmagic',
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

  getTables();
</script>

<template>
  <content-layout>
    <template #fixed>
      <n-form
        class="tools_settings"
        @submit.prevent.stop="sendForm"
        @keyup.enter.exact.prevent="sendForm"
      >
        <n-flex>
          <n-form-item
            label="Количество"
            :style="{ minWidth: '254px' }"
          >
            <n-input-number
              v-model:value="count"
              placeholder="Количество"
              :min="1"
            />
          </n-form-item>

          <n-form-item
            label="Источники"
            :style="{ minWidth: '254px' }"
          >
            <n-flex>
              <n-tooltip
                v-for="(source, key) in sources"
                :key="key"
              >
                <template #trigger>
                  <n-tag
                    :checked="source.checked"
                    checkable
                    round
                    @update:checked="
                      onSourceCheckedUpdate(source.shortName, $event)
                    "
                  >
                    {{ source.shortName }}
                  </n-tag>
                </template>

                <template #default>
                  {{ source.name }}
                </template>
              </n-tooltip>
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
        class="wild-magic-item"
      >
        <div class="wild-magic-item__body">
          <raw-content
            tag="span"
            :template="item.description"
          />
        </div>

        <n-tooltip>
          <template #trigger>
            <div class="wild-magic-item__src">
              {{ item.source.shortName }}
            </div>
          </template>

          <template #default>
            {{ item.source.name }}
          </template>
        </n-tooltip>
      </div>
    </template>
  </content-layout>
</template>

<style lang="scss" scoped>
  .wild-magic-item {
    border-radius: 12px;
    overflow: hidden;
    background-color: var(--bg-table-list);
    width: 100%;
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    padding: 12px;
    gap: 16px;

    &__body {
      flex: 1 1 100%;

      :deep(p) {
        &:last-of-type {
          margin-bottom: 0;
        }
      }
    }

    &__src {
      flex-shrink: 0;
    }
  }
</style>
