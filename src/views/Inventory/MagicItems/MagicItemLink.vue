<template>
    <router-link
        :to="{ path: magicItem.url }"
        custom
        v-bind="$props"
    >
        <a
            :class="classList"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler"
        >
            <div class="link-item__content">
                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <span class="link-item__name--rus">
                                {{ magicItem.name.rus }}
                            </span>

                            <span class="link-item__name--eng">
                                [{{ magicItem.name.eng }}]
                            </span>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <div
                            v-capitalize-first
                            :class="`is-${magicItem.rarity.type || 'unknown'}`"
                            class="link-item__type"
                        >
                            {{ magicItem.rarity.name }}
                        </div>

                        <div
                            v-if="magicItem.custom?.count"
                            class="link-item__count"
                        >
                            {{ `x${ magicItem.custom.count }` }}
                        </div>

                        <div
                            v-if="inTools"
                            class="link-item__price"
                        >
                            {{ `${ magicItem.custom?.price || magicItem.price || 0 } зм` }}
                        </div>

                        <div
                            v-if="magicItem.customization"
                            class="link-item__customization"
                        >
                            Настройка
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>
</template>

<script lang="ts">
    import type { RouteLocationPathRaw } from 'vue-router';
    import { useLink } from 'vue-router';
    import type { PropType } from 'vue';
    import { computed, defineComponent } from 'vue';
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';

    export default defineComponent({
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            to: {
                type: Object as PropType<RouteLocationPathRaw>,
                required: true
            },
            magicItem: {
                type: Object,
                default: () => ({})
            },
            inTools: {
                type: Boolean,
                default: false
            }
        },
        setup(props, { emit }) {
            const {
                navigate,
                isActive,
                href
            } = useLink(props);

            const classList = computed(() => ({
                'router-link-active': isActive.value,
                'is-green': props.magicItem?.source?.homebrew
            }));

            const clickHandler = () => {
                if (props.inTools) {
                    emit('select-item');

                    return;
                }

                navigate();
            };

            return {
                href,
                classList,
                clickHandler
            };
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../../assets/styles/modules/link-item";

    .link-item {
        &__type {
            padding-left: 14px;
            position: relative;
            color: var(--text-g-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;

            &:after {
                content: '';
                position: absolute;
                background: var(--border);
                border: 1px solid var(--border);
                border-radius: 50%;
                width: 10px;
                height: 10px;
                display: block;
                left: 0;
                top: 4px;
                //z-index: 1;
            }

            &.is-common {
                &:after {
                    background-color: var(--common);
                }
            }

            &.is-uncommon {
                &:after {
                    background-color: var(--uncommon);
                }
            }

            &.is-rare {
                &:after {
                    background-color: var(--rare);
                }
            }

            &.is-very-rare {
                &:after {
                    background-color: var(--very_rare);
                }
            }

            &.is-legendary {
                &:after {
                    background-color: var(--legendary);
                }
            }

            &.is-artifact {
                &:after {
                    background-color: var(--artifact);
                }
            }

            &.is-varies {
                &:after {
                    background: linear-gradient(
                                90deg,
                                var(--common) 10%,
                                var(--artifact) 100%
                            );
                }
            }
        }

        &__customization {
            color: var(--text-g-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
        }

        &__count {
            margin-left: auto;
            display: block;
        }

        &.router-link-active {
            .link-item {
                &__rating,
                &__type,
                &__count,
                &__price {
                    color: var(--text-btn-color);
                }
            }
        }
    }
</style>
