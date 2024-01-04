<template>
  <content-layout>
    <template #fixed>
      <form
        class="tools_settings"
        @submit.prevent="sendForm"
      >
        <div class="tools_settings__row">
          <span class="label">Расы:</span>

          <field-checkbox
            v-for="(source, key) in tables"
            :key="key"
            v-tippy="{ content: source.name }"
            :model-value="source.value"
            type="crumb"
            @update:model-value="source.value = $event"
          >
            {{ source.shortName }}
          </field-checkbox>
        </div>

        <div class="tools_settings__row">
          <span class="label">Количество:</span>

          <field-input
            v-model="count"
            :min="1"
            class="form-control select"
            is-number
            placeholder="Количеств"
          />
        </div>

        <div class="tools_settings__row btn-wrapper">
          <form-button @click.left.exact.prevent="sendForm">
            Сгенерировать
          </form-button>

          <form-button @click.left.exact.prevent="results = []">
            Очистить
          </form-button>
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

<script>
  import { throttle } from 'lodash-es';
  import { defineComponent, reactive } from 'vue';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import { errorHandler } from '@/shared/helpers/errorHandler.js';
  import FieldCheckbox from '@/shared/ui/kit/FieldType/FieldCheckbox.vue';
  import FieldInput from '@/shared/ui/kit/FieldType/FieldInput.vue';
  import FormButton from '@/shared/ui/kit/FormButton.vue';
  import RawContent from '@/shared/ui/RawContent.vue';

  export default defineComponent({
    components: {
      RawContent,
      FieldCheckbox,
      ContentLayout,
      FieldInput,
      FormButton
    },
    data: () => ({
      count: 1,
      tables: [],
      results: [],
      controller: undefined
    }),
    async beforeMount() {
      await this.getTables();
    },
    methods: {
      async getTables() {
        try {
          const resp = await this.$http.get({
            url: '/tools/wildmagic'
          });

          if (resp.status !== 200) {
            errorHandler(resp.statusText);

            return;
          }

          this.tables = resp.data.map(source => ({
            ...source,
            value: source.shortName === 'PHB'
          }));
        } catch (err) {
          errorHandler(err);
        }
      },

      // eslint-disable-next-line func-names
      sendForm: throttle(async function () {
        if (this.controller) {
          this.controller.abort();
        }

        this.controller = new AbortController();

        try {
          const options = {
            count: this.count || 1,
            sources: this.tables
              .filter(source => source.value)
              .map(source => source.shortName)
          };

          const resp = await this.$http.post({
            url: '/tools/wildmagic',
            payload: options,
            signal: this.controller.signal
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
      }, 300)
    }
  });
</script>

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

    &__body {
      flex: 1 1 100%;
    }

    &__src {
      flex-shrink: 0;
    }
  }
</style>
