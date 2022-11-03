<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: creature.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="creature"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="navigate()"
        >
            <div class="link-item__content">
                <div class="link-item__rating">
                    <span>{{ 'challengeRating' in creature ? creature.challengeRating : '-' }}</span>
                </div>

                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ creature.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ creature.name.eng }}]
                            </div>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <div
                            v-capitalize-first
                            class="link-item__type"
                        >
                            {{ creature.type }}
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
    import { useBestiaryStore } from "@/store/Bestiary/BestiaryStore";

    export default {
        name: 'CreatureLink',
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            creature: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            bestiaryStore: useBestiaryStore()
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-green': this.creature?.source?.homebrew,
                    'in-tab': this.inTab
                };
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import "../../assets/styles/modules/link-item";

    .link-item {
        &__rating {
            width: 42px;
            flex-shrink: 0;
            font-size: 17px;
            color: var(--text-color);
            border-right: 1px solid var(--border);
            margin-right: 12px;

            span {
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }

        &__type {
            color: var(--text-g-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
        }

        &.router-link-active {
            .link-item {
                &__rating,
                &__type {
                    color: var(--text-btn-color);
                }
            }
        }
    }
</style>
