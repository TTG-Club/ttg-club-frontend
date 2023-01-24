<template>
    <router-link
        :to="{ path: weapon.url }"
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
                        v-if="weapon.name"
                        class="link-item__row"
                    >
                        <div class="link-item__name">
                            <span class="link-item__name--rus">
                                {{ weapon.name.rus }}
                            </span>

                            <span
                                v-if="weapon.name.eng"
                                class="link-item__name--eng"
                            >
                                [{{ weapon.name.eng }}]
                            </span>
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
            weapon: {
                type: Object,
                default: () => ({})
            }
        },
        setup(props) {
            const {
                navigate,
                isActive,
                href
            } = useLink(props);

            const classList = computed(() => ({
                'router-link-active': isActive.value,
                'is-green': props.weapon?.homebrew
            }));

            return {
                href,
                classList,
                navigate
            };
        }
    });
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
