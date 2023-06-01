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

              <div>
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
        <div>
          <b>Тип:</b> {{ item.type.name }}
        </div>

        <div>
          <b>Длительность:</b> {{ item.type.additional }}
        </div>

        <br>

        <div>
          <raw-content :template="item.description" />
        </div>
      </div>
    </template>
  </content-layout>
</template>

<script>
  import throttle from 'lodash/throttle';
  import { reactive } from 'vue';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import errorHandler from '@/common/helpers/errorHandler';
  import UiCheckbox from '@/components/UI/kit/UiCheckbox.vue';
  import RawContent from '@/components/content/RawContent.vue';
  import UiInput from '@/components/UI/kit/UiInput.vue';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';

  export default {
    name: 'MadnessView',
    components: {
      RawContent,
      UiCheckbox,
      ContentLayout,
      UiButton,
      UiInput
    },
    data: () => ({
      count: 1,
      types: [],
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
            url: '/tools/madness'
          });

          if (resp.status !== 200) {
            errorHandler(resp.statusText);

            return;
          }

          this.types = resp.data.map(type => ({
            ...type,
            toggled: false
          }));
        } catch (err) {
          errorHandler(err);
        }
      },

      // eslint-disable-next-line func-names
      sendForm: throttle(async function() {
        if (this.controller) {
          this.controller.abort();
        }

        this.controller = new AbortController();

        try {
          const options = {
            count: this.count || 1
          };

          const type = this.types.find(el => el.toggled);

          if (type) {
            options.type = type.value;
          }

          const resp = await this.$http.post({
            url: '/tools/madness',
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
      }, 300),

      toggleType(e, type) {
        for (let i = 0; i < this.types.length; i++) {
          if (this.types[i].value !== type.value) {
            this.types[i].toggled = false;

            continue;
          }

          this.types[i].toggled = e;
        }
      }
    }
  };
</script>

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
