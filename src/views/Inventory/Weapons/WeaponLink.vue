<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: weapon.url }"
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
                        v-if="weapon.name"
                        class="link-item__row"
                    >
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ weapon.name.rus }}
                            </div>

                            <div
                                v-if="weapon.name.eng"
                                class="link-item__name--eng"
                            >
                                [{{ weapon.name.eng }}]
                            </div>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <!-- <div
                            v-if="weapon.type?.name"
                            class="link-item__type"
                        >
                            {{ weapon.type.name }}
                        </div> -->

                        <div
                            v-if="weapon.damage"
                            class="link-item__damage"
                        >
                            <span
                                v-if="weapon.damage.dice"
                                v-tippy="{ content: 'Урон' }"
                                class="link-item__damage_dice dice_text"
                            >
                                {{ weapon.damage.dice }}
                            </span>
                            &nbsp;
                            <span
                                v-if="weapon.damage.type"
                                v-tippy="{ content: 'Тип урона' }"
                                class="link-item__damage_type"
                            >
                                {{ weapon.damage.type }}
                            </span>
                        </div>

                        <div
                            v-if="weapon.price"
                            v-tippy="{ content: 'Стоимость' }"
                            class="link-item__price"
                        >
                            <span>
                                {{ weapon.price ? weapon.price : '—' }}
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
            weapon: {
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
                    'is-green': this.weapon.homebrew,
                    'in-tab': this.inTab
                };
            },

            clickHandler(callback) {
                callback();
            }
        }
    };
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss"/>
