<template>
    <content-layout :show-right-side="showRightSide">
        <template #fixed>
            <form
                class="tools_settings"
                @submit.prevent="sendForm"
            >
                <div class="tools_settings__row">
                    <div class="tools_settings__colum">
                        <div class="row">
                            <span class="label">Количество магии в мире:</span>

                            <ui-select
                                v-model="magicLevelsValue"
                                :options="magicLevels"
                                label="name"
                                track-by="value"
                            >
                                <template #placeholder>
                                    Количество
                                </template>
                            </ui-select>
                        </div>

                        <div class="row">
                            <span class="label">Результат проверки Харизмы (Убеждение):</span>

                            <ui-input
                                v-model="form.persuasion"
                                class="form-control select"
                                is-number
                                placeholder="Харизма (Убеждение)"
                            />
                        </div>
                    </div>
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

                <div
                    v-if="!form.unique"
                    class="tools_settings__row"
                >
                    <ui-checkbox
                        :model-value="settings.grouping"
                        type="toggle"
                        @update:model-value="settings.grouping = $event"
                    >
                        Группировать одинаковые
                    </ui-checkbox>
                </div>

                <div
                    v-if="!form.unique && settings.grouping"
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

                <div class="tools_settings__row btn-wrapper">
                    <ui-button @click.left.exact.prevent="sendForm">
                        Найти торговца
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
                        :subtitle="selected.item?.name.eng || 'On sale'"
                        :title="selected.item?.name.rus || 'В продаже'"
                        @close="close"
                    />
                </template>

                <template #default>
                    <div
                        v-if="!selected.item"
                        class="content-padding trader__empty"
                    >
                        <p>Список товаров пуст.</p>
                    </div>

                    <div
                        v-else
                        class="trader__content"
                    >
                        <spell-body
                            v-if="detailCard.spell"
                            :spell="detailCard.spell"
                        />

                        <magic-item-body :magic-item="detailCard.item" />
                    </div>
                </template>
            </content-detail>
        </template>

        <template #default>
            <magic-item-link
                v-for="(item, key) in groupedResults"
                :key="item.url + key"
                :is-active="selected.index === key"
                :magic-item="item"
                :to="{ path: item.url }"
                in-tools
                @select-item="selectItem(key)"
            />
        </template>
    </content-layout>
</template>

<script>
    import { reactive } from 'vue';
    import max from 'lodash/max';
    import mean from 'lodash/mean';
    import sortedUniq from 'lodash/sortedUniq';
    import throttle from 'lodash/throttle';
    import groupBy from 'lodash/groupBy';
    import { mapState } from 'pinia';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import UiSelect from '@/components/UI/kit/UiSelect.vue';
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import UiCheckbox from '@/components/UI/kit/UiCheckbox.vue';
    import MagicItemBody from '@/views/Inventory/MagicItems/MagicItemBody.vue';
    import SpellBody from '@/views/Character/Spells/SpellBody.vue';
    import MagicItemLink from '@/views/Inventory/MagicItems/MagicItemLink.vue';
    import errorHandler from '@/common/helpers/errorHandler';
    import ContentDetail from '@/components/content/ContentDetail.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import UiInput from '@/components/UI/kit/UiInput.vue';
    import UiButton from '@/components/UI/kit/UiButton.vue';

    export default {
        name: 'TraderView',
        components: {
            UiButton,
            UiInput,
            ContentDetail,
            MagicItemLink,
            SpellBody,
            MagicItemBody,
            UiCheckbox,
            SectionHeader,
            UiSelect,
            ContentLayout
        },
        data: () => ({
            magicLevels: [],
            form: {
                magicLevel: 1,
                persuasion: 1,
                unique: true
            },
            settings: {
                grouping: true,
                max: false
            },
            results: [],
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

            magicLevelsValue: {
                get() {
                    return this.magicLevels.find(el => el.value === this.form.magicLevel);
                },

                set(e) {
                    this.form.magicLevel = e.value;
                }
            },

            groupedResults() {
                if (!this.settings.grouping) {
                    return this.results;
                }

                const groups = Object.values(groupBy(this.results, o => o.name.rus));
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

                return res;
            }
        },
        async beforeMount() {
            await this.getLevels();
        },
        mounted() {
            this.showRightSide = !this.isMobile;
        },
        methods: {
            async getLevels() {
                try {
                    const resp = await this.$http.get({
                        url: '/tools/trader'
                    });

                    if (resp.status !== 200) {
                        errorHandler(resp.statusText);

                        return;
                    }

                    this.magicLevels = resp.data;
                } catch (err) {
                    errorHandler(err);
                }
            },

            // eslint-disable-next-line func-names
            sendForm: throttle(function() {
                if (this.controllers.list) {
                    this.controllers.list.abort();
                }

                this.controllers.list = new AbortController();

                const options = {
                    ...this.form,
                    persuasion: this.form.persuasion || 1
                };

                this.$http.post({
                    url: '/tools/trader',
                    payload: options,
                    signal: this.controllers.list.signal
                })
                    .then(res => {
                        if (res.status !== 200) {
                            errorHandler(res.statusText);

                            return;
                        }

                        this.results = [];

                        this.clearSelected();

                        this.$nextTick(() => {
                            this.results = res.data;
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

            async selectItem(index) {
                try {
                    if (this.controllers.detail) {
                        this.controllers.detail.abort();
                    }

                    this.error = false;
                    this.loading = true;

                    this.clearSelected();

                    this.controllers.detail = new AbortController();

                    const item = this.groupedResults[index];

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

                    this.showRightSide = true;
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

</style>
