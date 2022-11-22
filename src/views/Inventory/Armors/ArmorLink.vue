<template>
    <router-link
        :to="{ path: armor.url }"
        custom
        v-bind="$props"
    >
        <a
            :class="classList"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="navigate()"
        >
            <div class="link-item__content">
                <div class="link-item__body">
                    <div
                        v-if="armor.name"
                        class="link-item__row"
                    >
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ armor.name.rus }}
                            </div>

                            <div
                                v-if="armor.name.eng"
                                class="link-item__name--eng"
                            >
                                [{{ armor.name.eng }}]
                            </div>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <!-- <div
                            v-if="armor.type?.name"
                            class="link-item__type"
                        >
                            {{ armor.type.name }}
                        </div> -->

                        <div
                            v-if="armor.armorClass"
                            v-tippy="{ content: 'Класс доспеха (АС)' }"
                            class="link-item__ac"
                        >
                            <span>

                                {{ armor.armorClass }}
                            </span>
                        </div>

                        <div
                            v-if="armor.price"
                            v-tippy="{ content: 'Стоимость' }"
                            class="link-item__price"
                        ><span>

                            {{ armor.price }}
                        </span>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>
</template>

<script lang="ts">
    import {
        useLink
    } from 'vue-router';
    import {
        computed, defineComponent
    } from 'vue';
    import type { PropType } from 'vue';
    import type { RouteLocationPathRaw } from 'vue-router';
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
            armor: {
                type: Object,
                default: () => ({})
            }
        },
        setup(props) {
            const {
                navigate, isActive, href
            } = useLink(props);

            const classList = computed(() => ({
                'router-link-active': isActive.value,
                'is-green': props.armor?.homebrew
            }));

            return {
                href,
                classList,
                navigate
            };
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../../assets/styles/modules/link-item";

    .link-item {
        &__type,
        &__ac {
            color: var(--text-g-color);
        }

        &__price {
            color: var(--text-color-title);
        }

        &.router-link-active {
            .link-item {
                &__type,
                &__ac,
                &__price {
                    color: var(--text-btn-color);
                }
            }
        }
    }
</style>
