<template>
  <content-layout
    :show-right-side="showRightSide"
    :force-fullscreen-state="false"
  >
    <template #fixed>
      <form
        class="tools_settings"
        @submit.prevent="sendForm"
      >
        <div class="tools_settings__row">
          <span class="label">Показатель опасности монстров:</span>

          <ui-select
            v-model="crValue"
            :options="crList"
            label="name"
            track-by="value"
          >
            <template #placeholder> Показатель опасности </template>
          </ui-select>
        </div>

        <transition-group name="fade">
          <template v-if="settings.opened">
            <div class="tools_settings__row">
              <h5 class="label">Настройки предметов:</h5>

              <div class="tools_settings__column">
                <div class="row">
                  <div>
                    <ui-checkbox
                      :model-value="form.coins"
                      type="toggle"
                      @update:model-value="form.coins = $event"
                    >
                      Монеты
                    </ui-checkbox>
                  </div>

                  <div class="tools_settings__row">
                    <ui-checkbox
                      :model-value="form.magicItem"
                      type="toggle"
                      @update:model-value="form.magicItem = $event"
                    >
                      Магические предметы
                    </ui-checkbox>
                  </div>
                </div>

                <div class="row">
                  <div>
                    <ui-checkbox
                      :model-value="form.scroll"
                      type="toggle"
                      @update:model-value="form.scroll = $event"
                    >
                      Свитки
                    </ui-checkbox>
                  </div>

                  <div class="tools_settings__row">
                    <ui-checkbox
                      :model-value="form.trinket"
                      type="toggle"
                      @update:model-value="form.trinket = $event"
                    >
                      Безделушки
                    </ui-checkbox>
                  </div>
                </div>
              </div>
            </div>

            <hr class="hr_main" />

            <div class="tools_settings__row">
              <h5 class="label">Настройки вида:</h5>

              <div class="tools_settings__column">
                <div class="row">
                  <div>
                    <ui-checkbox
                      :model-value="form.art"
                      type="toggle"
                      @update:model-value="form.art = $event"
                    >
                      Предметы искусства
                    </ui-checkbox>
                  </div>

                  <div class="tools_settings__row">
                    <ui-checkbox
                      :model-value="form.gem"
                      type="toggle"
                      @update:model-value="form.gem = $event"
                    >
                      Драгоценные камни
                    </ui-checkbox>
                  </div>

                  <div class="tools_settings__row">
                    <ui-checkbox
                      :model-value="form.unique"
                      type="toggle"
                      @update:model-value="form.unique = $event"
                    >
                      Только уникальные
                    </ui-checkbox>
                  </div>
                </div>

                <div class="row">
                  <div>
                    <ui-checkbox
                      :model-value="settings.grouping"
                      type="toggle"
                      @update:model-value="settings.grouping = $event"
                    >
                      Группировать одинаковые
                    </ui-checkbox>
                  </div>

                  <div class="tools_settings__row">
                    <ui-checkbox
                      :model-value="settings.max"
                      type="toggle"
                      @update:model-value="settings.max = $event"
                    >
                      {{
                        `Отображать ${
                          settings.max ? 'максимальную' : 'среднюю'
                        } цену`
                      }}
                    </ui-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </transition-group>

        <div class="tools_settings__row btn-wrapper">
          <ui-button @click.left.exact.prevent="sendForm"> Создать </ui-button>

          <ui-button
            @click.left.exact.prevent="settings.opened = !settings.opened"
          >
            Настройки
          </ui-button>
        </div>
      </form>
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

<script lang="ts" setup>
  import { groupBy, max, mean, sortedUniq, throttle } from 'lodash-es';
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount, ref } from 'vue';

  import SpellBody from '@/pages/Character/Spells/SpellBody.vue';
  import MagicItemBody from '@/pages/Inventory/MagicItems/MagicItemBody.vue';
  import MagicItemLink from '@/pages/Inventory/MagicItems/MagicItemLink.vue';
  import TreasureItem from '@/pages/Inventory/Treasures/TreasureItem.vue';

  import SectionHeader from '@/features/SectionHeader.vue';

  import { useAxios } from '@/shared/compositions/useAxios';
  import { errorHandler } from '@/shared/helpers/errorHandler';
  import { useUIStore } from '@/shared/stores/UIStore';
  import ContentDetail from '@/shared/ui/content/ContentDetail.vue';
  import ContentLayout from '@/shared/ui/content/ContentLayout.vue';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';
  import UiSelect from '@/shared/ui/kit/UiSelect.vue';

  interface CrListItem {
    name: string;
    value: number;
  }

  const crList: CrListItem[] = [
    {
      name: '0-4',
      value: 1
    },
    {
      name: '5-10',
      value: 2
    },
    {
      name: '11-16',
      value: 3
    },
    {
      name: '17+',
      value: 4
    }
  ];

  const form = ref({
    cr: 1,
    coins: true,
    magicItem: true,
    scroll: true,
    trinket: true,
    art: true,
    gem: true,
    unique: true
  });

  const settings = ref({
    grouping: true,
    max: false,
    opened: false
  });

  const result = ref({});

  const detailCard = ref<{
    item?: any;
    spell?: any;
  }>({
    item: undefined,
    spell: undefined
  });

  const selected = ref<{
    index?: number;
    item?: any;
  }>({
    index: undefined,
    item: undefined
  });

  const loading = ref(false);
  const error = ref(false);
  const showRightSide = ref(false);

  const controllers = ref<{
    list?: AbortController;
    detail?: AbortController;
  }>({
    list: undefined,
    detail: undefined
  });

  const http = useAxios();
  const uiStore = useUIStore();

  const { isMobile } = storeToRefs(uiStore);

  const crValue = computed<CrListItem>({
    get() {
      return crList.find(el => el.value === form.value.cr) || crList[0];
    },

    set(e: CrListItem) {
      form.value.cr = e.value;
    }
  });

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

      const groups = Object.values(groupBy(value, o => o.name.rus));
      const entryRes = [];

      for (const group of groups) {
        const el = group[0];

        if (group.length === 1) {
          entryRes.push(el);

          continue;
        }

        const prices = sortedUniq(group.map(o => o.price));

        entryRes.push({
          ...el,
          custom: {
            count: group.length,
            price: settings.value.max ? max(prices) : Math.round(mean(prices))
          }
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
      cr: form.value.cr || 1
    };

    http
      .post({
        url: '/tools/treasury',
        payload: options,
        signal: controllers.value.list.signal
      })
      .then(res => {
        if (res.status !== 200) {
          errorHandler(res.statusText);

          return;
        }

        result.value = [];

        clearSelected();

        result.value = res.data as never;
      })
      .catch(err => {
        errorHandler(err);
      })
      .finally(() => {
        controllers.value.list = undefined;
      });
  }, 300);

  const selectItem = async (group: number, index: number) => {
    try {
      if (controllers.value.detail) {
        controllers.value.detail.abort();
      }

      error.value = false;
      loading.value = true;

      clearSelected();

      controllers.value.detail = new AbortController();

      const item = groupedResult.value[group][index];

      const resMagicItem = await http.post({
        url: item.url,
        signal: controllers.value.detail.signal
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
        const resSpell = await http.post({
          url: item.spell.url,
          signal: controllers.value.detail.signal
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
        item
      };

      showRightSide.value = true;
    } catch (err) {
      error.value = true;
      loading.value = false;

      detailCard.value = {
        item: undefined,
        spell: undefined
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
