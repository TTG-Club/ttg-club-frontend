<template>
    <router-link
        :to="{ path: creature.url }"
        class="link-item"
        :class="{ 'is-green': creature?.source?.homebrew }"
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
    </router-link>
</template>

<script>
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';

    export default {

        directives: {
            CapitalizeFirst
        },
        props: {
            creature: {
                type: Object,
                required: true
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
