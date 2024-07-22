<script lang="ts" setup>
  import { groupBy, max, mean, sortedUniq, throttle } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/ContentDetail.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import SectionHeader from '@/features/SectionHeader.vue';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import SpellBody from '@/pages/character/spells/spells-detail/SpellBody.vue';
  import MagicItemBody from '@/pages/inventory/magic-items/magic-items-detail/MagicItemBody.vue';
  import MagicItemLink from '@/pages/inventory/magic-items/MagicItemLink.vue';
  import TreasureItem from '@/pages/inventory/treasures/TreasureItem.vue';

  import type { AxiosError, AxiosResponse } from 'axios';
  import type { SelectOption } from 'naive-ui';

  const crList: Array<SelectOption> = [
    {
      label: '0-4',
      value: 1,
    },
    {
      label: '5-10',
      value: 2,
    },
    {
      label: '11-16',
      value: 3,
    },
    {
      label: '17+',
      value: 4,
    },
  ];

  const form = ref({
    cr: 1,
    coins: true,
    magicItem: true,
    scroll: true,
    trinket: true,
    art: true,
    gem: true,
    unique: true,
  });

  const settings = ref({
    grouping: true,
    max: false,
    opened: false,
  });

  const result = ref({});

  const detailCard = ref<{
    item?: any;
    spell?: any;
  }>({
    item: undefined,
    spell: undefined,
  });

  const selected = ref<{
    index?: number;
    item?: any;
  }>({
    index: undefined,
    item: undefined,
  });

  const loading = ref(false);
  const error = ref(false);
  const showRightSide = ref(false);

  const controllers = ref<{
    list?: AbortController;
    detail?: AbortController;
  }>({
    list: undefined,
    detail: undefined,
  });

  const uiStore = useUIStore();

  const { isMobile } = storeToRefs(uiStore);

  const groupedResult = computed(() => {
    if (!settings.value.grouping) {
      return result.value;
    }

    const res: any = {};

    for (const [key, value] of Object.entries(result.value)) {
      if (!value || !Array.isArray(value)) {
        res[key] = value;

        continue;
      }

      const groups = Object.values(groupBy(value, (o) => o.name.rus));
      const entryRes = [];

      for (const group of groups) {
        const el = group[0];

        if (group.length === 1) {
          entryRes.push(el);

          continue;
        }

        const prices = sortedUniq(group.map((o) => o.price));

        entryRes.push({
          ...el,
          custom: {
            count: group.length,
            price: settings.value.max ? max(prices) : Math.round(mean(prices)),
          },
        });
      }

      res[key] = entryRes;
    }

    return res;
  });

  onBeforeMount(() => {
    showRightSide.value = !isMobile.value;
  });

  const clearSelected = () => {
    selected.value.index = undefined;
    selected.value.item = undefined;
    detailCard.value.item = undefined;
    detailCard.value.spell = undefined;
  };

  const sendForm = throttle(() => {
    if (controllers.value.list) {
      controllers.value.list.abort();
    }

    controllers.value.list = new AbortController();

    const options = {
      ...form.value,
      cr: form.value.cr || 1,
    };

    httpClient
      .post({
        url: '/tools/treasury',
        payload: options,
        signal: controllers.value.list.signal,
      })
      .then((res: AxiosResponse) => {
        if (res.status !== 200) {
          errorHandler(res.statusText);

          return;
        }

        clearSelected();

        result.value = res.data;
      })
      .catch((err: AxiosError) => {
        errorHandler(err);
      })
      .finally(() => {
        controllers.value.list = undefined;
      });
  }, 300);

  const selectItem = async (group: string, index: number) => {
    try {
      if (controllers.value.detail) {
        controllers.value.detail.abort();
      }

      error.value = false;
      loading.value = true;

      clearSelected();

      controllers.value.detail = new AbortController();

      const item = groupedResult.value[group][index];

      const resMagicItem = await httpClient.post({
        url: item.url,
        signal: controllers.value.detail.signal,
      });

      if (resMagicItem.status !== 200) {
        error.value = true;
        loading.value = false;

        errorHandler(resMagicItem.statusText);

        return;
      }

      detailCard.value.item = resMagicItem.data;
      controllers.value.detail = new AbortController();

      if (item.spell?.url) {
        const resSpell = await httpClient.post({
          url: item.spell.url,
          signal: controllers.value.detail.signal,
        });

        if (resSpell.status !== 200) {
          error.value = true;
          loading.value = false;

          errorHandler(resSpell.statusText);

          return;
        }

        detailCard.value.spell = resSpell.data;
      }

      selected.value = {
        index,
        item,
      };

      showRightSide.value = true;
    } catch (err) {
      error.value = true;
      loading.value = false;

      detailCard.value = {
        item: undefined,
        spell: undefined,
      };

      errorHandler(err);
    } finally {
      loading.value = false;
      controllers.value.detail = undefined;
    }
  };

  const close = () => {
    showRightSide.value = false;
  };
</script>

<template>
  <content-layout
    :show-right-side="showRightSide"
    :force-fullscreen-state="false"
  >
    <template #fixed>
      <n-form
        class="tools_settings"
        @submit.prevent.stop="sendForm"
        @keyup.enter.exact.prevent.stop="sendForm"
      >
        <n-form-item label="Показатель опасности монстров">
          <n-select
            v-model:value="form.cr"
            :options="crList"
            :show-checkmark="false"
            placeholder="Показатель опасности"
          />
        </n-form-item>

        <n-collapse-transition :show="settings.opened">
          <n-flex vertical>
            <n-text tag="h5">Настройки предметов</n-text>

            <n-grid
              cols="1 460:2"
              x-gap="8"
              y-gap="8"
            >
              <n-grid-item>
                <n-checkbox v-model:checked="form.coins">Монеты</n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="form.magicItem">
                  Магические предметы
                </n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="form.scroll">Свитки</n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="form.trinket">
                  Безделушки
                </n-checkbox>
              </n-grid-item>
            </n-grid>
          </n-flex>

          <n-divider />

          <n-flex
            vertical
            :style="{ marginBottom: '24px' }"
          >
            <n-text tag="h5">Настройки вида</n-text>

            <n-grid
              cols="1 460:2"
              x-gap="8"
              y-gap="8"
            >
              <n-grid-item>
                <n-checkbox v-model:checked="form.art">
                  Предметы искусства
                </n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="form.gem">
                  Драгоценные камни
                </n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="form.unique">
                  Только уникальные
                </n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="settings.grouping">
                  Группировать одинаковые
                </n-checkbox>
              </n-grid-item>

              <n-grid-item>
                <n-checkbox v-model:checked="settings.max">
                  Отображать максимальную цену
                </n-checkbox>
              </n-grid-item>
            </n-grid>
          </n-flex>
        </n-collapse-transition>

        <n-flex>
          <n-button
            type="primary"
            attr-type="submit"
          >
            Создать
          </n-button>

          <n-button
            @click.left.exact.prevent="settings.opened = !settings.opened"
          >
            Настройки
          </n-button>
        </n-flex>
      </n-form>
    </template>

    <template #right-side>
      <content-detail>
        <template #fixed>
          <section-header
            :fullscreen="!isMobile"
            :subtitle="selected.item?.name.eng || 'In treasury'"
            :title="selected.item?.name.rus || 'В сокровищнице'"
            @close="close"
          />
        </template>

        <template #default>
          <div
            v-if="!selected.item"
            class="content-padding treasury__empty"
          >
            <p>Список товаров пуст.</p>
          </div>

          <div
            v-else
            class="treasury__content"
          >
            <magic-item-body :magic-item="detailCard.item" />

            <spell-body
              v-if="detailCard.spell"
              :spell="detailCard.spell"
            />
          </div>
        </template>
      </content-detail>
    </template>

    <template #default>
      <div
        v-if="groupedResult.coins"
        class="treasury-group"
      >
        <h4 class="header_separator">
          <span>Монеты</span>
        </h4>

        <table class="table">
          <tbody>
            <tr>
              <td>{{ groupedResult.coins.copper || 0 }} мм</td>

              <td>{{ groupedResult.coins.silver || 0 }} см</td>

              <td>{{ groupedResult.coins.electrum || 0 }} эм</td>

              <td>{{ groupedResult.coins.gold || 0 }} зм</td>

              <td>{{ groupedResult.coins.platinum || 0 }} пм</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="groupedResult.magicItems?.length"
        class="treasury-group"
      >
        <h4 class="header_separator">
          <span>Магические предметы</span>
        </h4>

        <magic-item-link
          v-for="(item, key) in groupedResult.magicItems"
          :key="item.url"
          :is-active="selected.index === key"
          :magic-item="item"
          :to="{ path: item.url }"
          in-tools
          @select-item="selectItem('magicItems', key)"
        />
      </div>

      <div
        v-if="groupedResult.gems?.length"
        class="treasury-group"
      >
        <h4 class="header_separator">
          <span>Драгоценные камни</span>
        </h4>

        <treasure-item
          v-for="(item, key) in groupedResult.gems"
          :key="item.name.eng + key"
          :treasure="item"
        />
      </div>

      <div
        v-if="groupedResult.arts?.length"
        class="treasury-group"
      >
        <h4 class="header_separator">
          <span>Предметы искусства</span>
        </h4>

        <treasure-item
          v-for="(item, key) in groupedResult.arts"
          :key="item.name.eng + key"
          :treasure="item"
        />
      </div>

      <div
        v-if="groupedResult.trinkets?.length"
        class="treasury-group"
      >
        <h4 class="header_separator">
          <span>Безделушки</span>
        </h4>

        <treasure-item
          v-for="(item, key) in groupedResult.trinkets"
          :key="item.name.eng + key"
          :treasure="item"
        />
      </div>
    </template>
  </content-layout>
</template>
