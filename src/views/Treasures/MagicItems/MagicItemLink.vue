<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: magicItem.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="magicItem"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler(navigate)"
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
                            <div class="link-item__name--rus">
                                {{ magicItem.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ magicItem.name.eng }}]
                            </div>
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

<script>
    import { RouterLink } from 'vue-router';
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';
    import { useMagicItemsStore } from "@/store/Treasures/MagicItemsStore";

    export default {

        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            magicItem: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            },
            inTools: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            magicItemsStore: useMagicItemsStore()
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-green': this.magicItem?.source?.homebrew,
                    'in-tab': this.inTab
                };
            },

            clickHandler(callback) {
                if (this.inTools) {
                    this.$emit('select-item');

                    return;
                }

                callback();
            }
        }
    };
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
