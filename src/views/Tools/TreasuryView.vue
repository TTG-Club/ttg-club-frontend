<template>
    <content-layout :show-right-side="showRightSide">
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
                        <template #placeholder>
                            Показатель опасности
                        </template>
                    </ui-select>
                </div>

                <transition-group name="fade">
                    <template v-if="settings.opened">
                        <div class="tools_settings__row">
                            <h5 class="label">
                                Настройки предметов:
                            </h5>

                            <div class="tools_settings__colum">
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

                        <hr class="hr_main">

                        <div class="tools_settings__row">
                            <h5 class="label">
                                Настройки вида:
                            </h5>

                            <div class="tools_settings__colum">
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

                                    <div
                                        class="tools_settings__row"
                                    >
                                        <ui-checkbox
                                            :model-value="settings.max"
                                            type="toggle"
                                            @update:model-value="settings.max = $event"
                                        >
                                            {{ `Отображать ${ settings.max ? 'максимальную' : 'среднюю' } цену` }}
                                        </ui-checkbox>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </transition-group>

                <div class="tools_settings__row btn-wrapper">
                    <ui-button @click.left.exact.prevent="sendForm">
                        Создать
                    </ui-button>

                    <ui-button @click.left.exact.prevent="settings.opened = !settings.opened">
                        <template #icon-left>
                            <svg-icon :icon-name="settings.opened ? 'show-pass' : 'hide-pass'" />
                        </template>

                        <template #default>
                            Настройки
                        </template>
                    </ui-button>
                </div>
            </form>
        </template>

        <template #right-side>
            <content-detail>
                <template #fixed>
                    <section-header
                        :close-on-desktop="fullscreen"
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

<script>
    import { reactive } from 'vue';
    import sortedUniq from 'lodash/sortedUniq';
    import groupBy from 'lodash/groupBy';
    import max from 'lodash/max';
    import mean from 'lodash/mean';
    import throttle from 'lodash/throttle';
    import { mapState } from 'pinia';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import UiSelect from '@/components/form/UiSelect.vue';
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import UiCheckbox from '@/components/form/UiCheckbox.vue';
    import MagicItemBody from '@/views/Inventory/MagicItems/MagicItemBody.vue';
    import SpellBody from '@/views/Character/Spells/SpellBody.vue';
    import TreasureItem from '@/views/Inventory/Treasures/TreasureItem.vue';
    import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';
    import errorHandler from '@/common/helpers/errorHandler';
    import ContentDetail from '@/components/content/ContentDetail.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import UiButton from '@/components/form/UiButton.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default {
        name: 'TreasuryView',
        components: {
            ContentDetail,
            MagicItemLink,
            TreasureItem,
            SpellBody,
            MagicItemBody,
            UiCheckbox,
            SectionHeader,
            UiSelect,
            ContentLayout,
            UiButton,
            SvgIcon
        },
        data: () => ({
            crList: [
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
            ],
            form: {
                cr: 1,
                coins: true,
                magicItem: true,
                scroll: true,
                trinket: true,
                art: true,
                gem: true,
                unique: true
            },
            settings: {
                grouping: true,
                max: false,
                opened: false
            },
            result: {},
            detailCard: {
                item: undefined,
                spell: undefined
            },
            selected: {
                index: undefined,
                item: undefined
            },
            loading: false,
            error: false,
            controllers: {
                list: undefined,
                detail: undefined
            },
            showRightSide: false
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile']),

            crValue: {
                get() {
                    return this.crList.find(el => el.value === this.form.cr);
                },

                set(e) {
                    this.form.cr = e.value;
                }
            },

            groupedResult() {
                if (!this.settings.grouping) {
                    return this.result;
                }

                const result = {};

                for (const [key, value] of Object.entries(this.result)) {
                    if (!value || !Array.isArray(value)) {
                        result[key] = value;

                        continue;
                    }

                    const groups = Object.values(groupBy(value, o => o.name.rus));
                    const res = [];

                    for (const group of groups) {
                        const el = group[0];

                        if (group.length === 1) {
                            res.push(el);

                            continue;
                        }

                        const prices = sortedUniq(group.map(o => o.price));

                        res.push(reactive({
                            ...el,
                            custom: {
                                count: group.length,
                                price: this.settings.max ? max(prices) : Math.round(mean(prices))
                            }
                        }));
                    }

                    result[key] = res;
                }

                return result;
            }
        },
        mounted() {
            this.showRightSide = !this.isMobile;
        },
        methods: {
            // eslint-disable-next-line func-names
            sendForm: throttle(function() {
                if (this.controllers.list) {
                    this.controllers.list.abort();
                }

                this.controllers.list = new AbortController();

                const options = {
                    ...this.form,
                    cr: this.form.cr || 1
                };

                this.$http.post({
                    url: '/tools/treasury',
                    payload: options,
                    signal: this.controllers.list.signal
                })
                    .then(res => {
                        if (res.status !== 200) {
                            errorHandler(res.statusText);

                            return;
                        }

                        this.result = [];

                        this.clearSelected();

                        this.$nextTick(() => {
                            this.result = res.data;
                        });
                    })
                    .catch(err => {
                        errorHandler(err);
                    })
                    .finally(() => {
                        this.controllers.list = undefined;
                    });
            }, 300),

            clearSelected() {
                this.selected.index = undefined;
                this.selected.item = undefined;
                this.detailCard.item = undefined;
                this.detailCard.spell = undefined;
            },

            async selectItem(group, index) {
                try {
                    if (this.controllers.detail) {
                        this.controllers.detail.abort();
                    }

                    this.error = false;
                    this.loading = true;

                    this.clearSelected();

                    this.controllers.detail = new AbortController();

                    const item = this.groupedResult[group][index];

                    const resMagicItem = await this.$http.post({
                        url: item.url,
                        signal: this.controllers.detail.signal
                    });

                    if (resMagicItem.status !== 200) {
                        this.error = true;
                        this.loading = false;

                        errorHandler(resMagicItem.statusText);

                        return;
                    }

                    this.detailCard.item = resMagicItem.data;
                    this.controllers.detail = new AbortController();

                    if (item.spell?.url) {
                        const resSpell = await this.$http.post({
                            url: item.spell.url,
                            signal: this.controllers.detail.signal
                        });

                        if (resSpell.status !== 200) {
                            this.error = true;
                            this.loading = false;

                            errorHandler(resSpell.statusText);

                            return;
                        }

                        this.detailCard.spell = resSpell.data;
                    }

                    this.selected = {
                        index,
                        item
                    };
                } catch (err) {
                    this.error = true;
                    this.loading = false;

                    this.detailCard = {
                        item: undefined,
                        spell: undefined
                    };

                    errorHandler(err);
                } finally {
                    this.loading = false;
                    this.controllers.detail = undefined;
                }
            },

            close() {
                this.showRightSide = false;
            }
        }
    };
</script>

<style lang="scss" scoped>
    .tools_settings {
        &__row {
            margin-top: 12px;

            &.btn-wrapper {
                display: flex;
            }
        }
    }
</style>
