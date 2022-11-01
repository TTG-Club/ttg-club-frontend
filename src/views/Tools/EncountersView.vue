<template>
    <content-layout>
        <template #fixed>
            <form
                class="tools_settings"
                @submit.prevent="sendForm"
            >
                <div class="tools_settings__row">
                    <div class="tools_settings__colum">
                        <div class="row">
                            <span class="label">Средний уровень Группы</span>

                            <ui-select
                                v-model="level"
                                :options="levels"
                                label="name"
                                track-by="value"
                            >
                                <template #placeholder>
                                    Уровень
                                </template>
                            </ui-select>
                        </div>

                        <div class="row">
                            <span class="label">Окружение</span>

                            <ui-select
                                v-model="env"
                                :options="environments"
                                label="name"
                                track-by="value"
                            >
                                <template #placeholder>
                                    Окружение
                                </template>
                            </ui-select>
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

                    <ui-button
                        v-if="isTableDisabled"
                        @click.left.exact.prevent="getTable"
                    >
                        Показать таблицу
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
                    <b>Источник:</b> {{ item.source.name }}
                </div>

                <div>
                    <b>Таблица:</b> {{ item.tableName }}
                </div>

                <br>

                <div>
                    <raw-content :template="item.description"/>
                </div>
            </div>
        </template>
    </content-layout>

    <base-modal
        v-if="table.data"
        v-model="table.show"
    >
        <template #title>
            {{ table.data.name }}
        </template>

        <template #default>
            <div class="content-padding">
                <roll-table :table="table.data"/>
            </div>
        </template>
    </base-modal>
</template>

<script>
    import throttle from 'lodash/throttle';
    import { reactive } from "vue";
    import ContentLayout from "@/components/content/ContentLayout";
    import errorHandler from "@/common/helpers/errorHandler";
    import RawContent from "@/components/content/RawContent";
    import UiSelect from "@/components/form/UiSelect";
    import UiButton from "@/components/form/UiButton";
    import BaseModal from "@/components/UI/modals/BaseModal";
    import RollTable from "@/components/UI/RollTable";

    export default {
        name: "EncountersView",
        components: {
            RollTable,
            BaseModal,
            UiButton,
            UiSelect,
            RawContent,
            ContentLayout
        },
        data: () => ({
            controller: undefined,
            environments: [],
            levels: [],
            results: [],
            table: {
                show: false,
                data: undefined
            },
            form: {
                level: '',
                environment: ''
            }
        }),
        computed: {
            isTableDisabled() {
                return this.form.level && this.form.environment;
            },

            level: {
                get() {
                    if (!this.form.level) {
                        return '';
                    }

                    return this.levels.find(level => level.value === this.form.level);
                },

                set(e) {
                    this.form.level = e.value;
                }
            },

            env: {
                get() {
                    if (!this.form.environment) {
                        return '';
                    }

                    return this.environments.find(env => env.value === this.form.environment);
                },

                set(e) {
                    this.form.environment = e.value;
                }
            }
        },
        async beforeMount() {
            await this.getOptions();
        },
        methods: {
            async getOptions() {
                try {
                    const resp = await this.$http.get('/tools/encounters');

                    if (resp.status !== 200) {
                        errorHandler(resp.statusText);

                        return;
                    }

                    this.environments = resp.data.environments;
                    this.levels = resp.data.levels;
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
                    const options = {};

                    for (const [key, value] of Object.entries(this.form)) {
                        if (!value) {
                            continue;
                        }

                        options[key] = value;
                    }

                    const resp = await this.$http.post('/tools/encounters', options, this.controller.signal);

                    if (resp.status !== 200) {
                        errorHandler(resp.statusText);

                        return;
                    }

                    this.results.unshift(reactive(resp.data));
                } catch (err) {
                    errorHandler(err);
                } finally {
                    this.controller = undefined;
                }
            }, 300),

            async getTable() {
                if (this.controller) {
                    this.controller.abort();
                }

                this.controller = new AbortController();

                try {
                    const resp = await this.$http.post(
                        '/tools/encounters/table',
                        this.form,
                        this.controller.signal
                    );

                    if (resp.status !== 200) {
                        errorHandler(resp.statusText);

                        return;
                    }

                    this.table = {
                        show: true,
                        data: resp.data
                    };
                } catch (err) {
                    errorHandler(err);
                } finally {
                    this.controller = undefined;
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
