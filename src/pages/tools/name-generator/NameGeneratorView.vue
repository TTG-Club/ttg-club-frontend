<script>
  import { throttle } from 'lodash-es';

  import RawContent from '@/shared/ui/RawContent.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  export default defineComponent({
    components: {
      RawContent,
      ContentLayout,
    },
    data: () => ({
      count: 1,
      tables: [],
      results: [],
      controller: undefined,
    }),
    async beforeMount() {
      await this.getTables();
    },
    methods: {
      async getTables() {
        try {
          const resp = await this.$http.get({
            url: '/tools/wildmagic',
          });

          if (resp.status !== 200) {
            errorHandler(resp.statusText);

            return;
          }

          this.tables = resp.data.map((source) => ({
            ...source,
            value: source.shortName === 'PHB',
          }));
        } catch (err) {
          errorHandler(err);
        }
      },

      sendForm: throttle(async () => {
        if (this.controller) {
          this.controller.abort();
        }

        this.controller = new AbortController();

        try {
          const options = {
            count: this.count || 1,
            sources: this.tables
              .filter((source) => source.value)
              .map((source) => source.shortName),
          };

          const resp = await this.$http.post({
            url: '/tools/wildmagic',
            payload: options,
            signal: this.controller.signal,
          });

          if (resp.status !== 200) {
            errorHandler(resp.statusText);

            return;
          }

          for (const el of resp.data) {
            this.results.unshift(reactive(el));
          }
        } catch (err) {
          errorHandler(err);
        } finally {
          this.controller = undefined;
        }
      }, 300),
    },
  });
</script>

<template>
  <content-layout>
    <template #fixed>
      <form
        class="tools_settings"
        @submit.prevent="sendForm"
      >
        <div class="tools_settings__row">
          <span class="label">Расы:</span>

          <n-checkbox
            v-for="(source, key) in tables"
            :key="key"
            v-model:checked="source.value"
            v-tippy="{ content: source.name }"
          >
            {{ source.shortName }}
          </n-checkbox>
        </div>

        <div class="tools_settings__row">
          <span class="label">Количество:</span>

          <n-input-number
            v-model:value="count"
            :min="1"
            class="form-control select"
            placeholder="Количеств"
          />
        </div>

        <div class="tools_settings__row btn-wrapper">
          <n-button
            type="primary"
            @click.left.exact.prevent="sendForm"
          >
            Сгенерировать
          </n-button>

          <n-button
            secondary
            @click.left.exact.prevent="results = []"
          >
            Очистить
          </n-button>
        </div>
      </form>
    </template>

    <template #default>
      <div
        v-for="(item, key) in results"
        :key="key"
        class="wild-magic-item"
      >
        <div class="wild-magic-item__body">
          <raw-content :template="item.description" />
        </div>

        <div
          v-tippy="{ content: item.source.name }"
          class="wild-magic-item__src"
        >
          {{ item.source.shortName }}
        </div>
      </div>
    </template>
  </content-layout>
</template>

<style lang="scss" scoped>
  .wild-magic-item {
    overflow: hidden;
    display: flex;
    align-items: flex-start;

    width: 100%;
    margin-bottom: 12px;
    padding: 12px;

    background-color: var(--bg-table-list);
    border-radius: 12px;

    &__body {
      flex: 1 1 100%;
    }

    &__src {
      flex-shrink: 0;
    }
  }
</style>
