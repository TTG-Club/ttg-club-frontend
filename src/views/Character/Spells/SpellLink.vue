<template>
    <router-link
        :to="{ path: spell.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="spell"
            :class="classList"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler"
        >
            <div class="link-item__content">
                <div
                    v-tippy="{ content: spell.level ? `${spell.level} уровень заклинания` : 'Заговор' }"
                    class="link-item__lvl"
                >
                    <span>{{ spell.level || '◐' }}</span>
                </div>

                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <p class="link-item__name--rus">
                                {{ spell.name.rus }}
                            </p>

                            <p class="link-item__name--eng">
                                [{{ spell.name.eng }}]
                            </p>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <div
                            v-if="spell.concentration || spell.ritual"
                            class="link-item__modifications"
                        >
                            <div
                                v-if="spell.concentration"
                                v-tippy="{ content: 'Концентрация' }"
                                class="link-item__modification"
                            >
                                К
                            </div>

                            <div
                                v-if="spell.ritual"
                                v-tippy="{ content: 'Ритуал' }"
                                class="link-item__modification"
                            >
                                Р
                            </div>
                        </div>

                        <div
                            v-capitalize-first
                            class="link-item__school"
                        >
                            {{ spell.school }}
                        </div>

                        <div
                            class="link-item__components"
                        >
                            <div
                                v-tippy="{ content: 'Вербальный', onShow() { return !!spell?.components?.v } }"
                                class="link-item__component"
                            >
                                {{ spell?.components?.v ? 'В' : '·' }}
                            </div>

                            <div
                                v-tippy="{ content: 'Соматический', onShow() { return !!spell?.components?.s } }"
                                class="link-item__component"
                            >
                                {{ spell?.components?.s ? 'С' : '·' }}
                            </div>

                            <div
                                v-tippy="{ content: 'Материальный', onShow() { return !!spell?.components?.m } }"
                                class="link-item__component"
                            >
                                {{ !!spell?.components?.m ? 'М' : '·' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>

    <base-modal
        v-if="modal.data"
        v-model="modal.show"
        :bookmark="bookmarkObj"
    >
        <template #title>
            {{ modal.data.name.rus }}
        </template>

        <template #default>
            <spell-body :spell="modal.data" />
        </template>
    </base-modal>
</template>

<script lang="ts">
    import type { RouteLocationPathRaw } from 'vue-router';
    import { useLink } from 'vue-router';
    import type { PropType } from 'vue';
    import {
        computed, defineComponent, ref
    } from 'vue';
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';
    import BaseModal from '@/components/UI/modals/BaseModal.vue';
    import { useAxios } from '@/common/composition/useAxios';
    import SpellBody from '@/views/Character/Spells/SpellBody.vue';

    export default defineComponent({
        components: {
            SpellBody,
            BaseModal
        },
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            to: {
                type: Object as PropType<RouteLocationPathRaw>,
                required: true
            },
            spell: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const http = useAxios();

            const {
                navigate,
                isActive,
                href
            } = useLink(props);

            const modal = ref({
                show: false,
                data: undefined
            });

            const bookmarkObj = computed(() => ({
                url: props.spell.url,
                name: props.spell.name.rus
            }));

            const classList = computed(() => ({
                'router-link-active': isActive.value,
                'is-green': props.spell?.source?.homebrew
            }));

            const clickHandler = async () => {
                if (!props.inTab) {
                    await navigate();

                    return;
                }

                try {
                    if (!modal.value.data) {
                        const resp = await http.post({
                            url: props.spell.url
                        });

                        modal.value.data = resp.data;
                    }

                    modal.value.show = true;
                } catch (err) {
                    console.error(err);
                }
            };

            return {
                href,
                modal,
                bookmarkObj,
                classList,
                clickHandler
            };
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../../assets/styles/modules/link-item";

    .link-item {
        &__lvl {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 17px;
            color: var(--text-color);
            border-right: 1px solid var(--border);
            margin-right: 12px;
            margin-left: -8px;
        }

        &__modifications {
            display: flex;
            margin-right: 8px;
        }

        &__modification {
            padding: 0 6px;
            border-radius: 6px;
            background-color: var(--primary);
            color: var(--text-btn-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;

            & + & {
                margin-left: 4px;
            }
        }

        &__school {
            color: var(--text-g-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &__components {
            display: flex;
            margin-left: auto;
        }

        &__component {
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
            color: var(--text-color);
            width: 10px;
            text-align: center;

            & + & {
                margin-left: 4px;
            }
        }

        &.router-link-active {
            .link-item {
                &__lvl,
                &__modification,
                &__school,
                &__component {
                    color: var(--text-btn-color);
                }
            }
        }
    }
</style>
