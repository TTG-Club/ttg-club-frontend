<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: armor.url }"
        custom
        v-bind="$props"
    >
        <a
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler(navigate)"
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

<script>
    import { RouterLink } from "vue-router";

    export default {

        props: {
            armor: {
                type: Object,
                required: true,
                default: undefined
            },
            inTab: {
                type: Boolean,
                default: false
            },
            ...RouterLink.props
        },
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-green': this.armor.homebrew,
                    'in-tab': this.inTab
                };
            },

            clickHandler(callback) {
                callback();
            }
        }
    };
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
