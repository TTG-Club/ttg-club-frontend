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
                <div
                    v-tippy="{ content: magicItem.rarity.name }"
                    :class="`is-${magicItem.rarity.type || 'unknown'}`"
                    class="link-item__rarity"
                >
                    <span>{{ magicItem.rarity.short }}</span>
                </div>

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
                            class="link-item__type"
                        >
                            {{ magicItem.type.name }}
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
        &__rarity {
            width: 42px;
            flex-shrink: 0;
            font-size: 17px;
            color: var(--text-color);
            border-right: 1px solid var(--border);
            position: relative;
            margin-right: 16px;
            margin-left: -8px;

            span {
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;

                &:after {
                    content: '';
                    position: absolute;
                    background: var(--border);
                    border: 1px solid var(--border);
                    border-radius: 50%;
                    width: 11px;
                    height: 11px;
                    display: block;
                    top: 50%;
                    right: 0;
                    z-index: 1;
                    box-shadow: 0 0 1px 1px #0006;
                    transform: translateY(-50%) translateX(50%);
                }
            }

            &.is-common {
                span {
                    &:after {
                        background-color: var(--common);
                    }
                }
            }

            &.is-uncommon {
                span {
                    &:after {
                        background-color: var(--uncommon);
                    }
                }
            }

            &.is-rare {
                span {
                    &:after {
                        background-color: var(--rare);
                    }
                }
            }

            &.is-very-rare {
                span {
                    &:after {
                        background-color: var(--very_rare);
                    }
                }
            }

            &.is-legendary {
                span {
                    &:after {
                        background-color: var(--legendary);
                    }
                }
            }

            &.is-artifact {
                span {
                    &:after {
                        background-color: var(--artifact);
                    }
                }
            }

            &.is-varies {
                span {
                    &:after {
                        background: linear-gradient(
                                    90deg,
                                    var(--common) 0%,
                                    var(--uncommon) 20%,
                                    var(--rare) 40%,
                                    var(--very_rare) 60%,
                                    var(--legendary) 80%,
                                    var(--artifact) 100%
                                );
                    }
                }
            }
        }

        &__type {
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
