<template>
    <router-link
        v-slot="{ href }"
        :to="{ path: raceItem.url }"
        custom
        v-bind="$props"
    >
        <div
            ref="raceItem"
            :class="parentClassList"
            class="link-item-expand"
            v-bind="$attrs"
        >
            <div class="link-item-expand__content">
                <img
                    v-lazy="raceItem.image"
                    alt="img-bg"
                    class="link-item-expand__content__img-bg"
                >

                <div class="link-item-expand__content__gradient" />

                <div class="link-item-expand__main">
                    <a
                        :href="href"
                        class="link-item-expand__link"
                        @click.left.prevent.exact="selectRace"
                    >

                        <span class="link-item-expand__body">
                            <span class="link-item-expand__body_row">
                                <span class="link-item-expand__name">
                                    <span class="link-item-expand__name--rus">
                                        {{ raceItem.name.rus }}
                                    </span>

                                    <span class="link-item-expand__name--eng">
                                        {{ raceItem.name.eng }}
                                    </span>
                                </span>
                            </span>

                            <span class="link-item-expand__body_row">
                                <span
                                    v-if="abilities"
                                    class="link-item-expand__tag"
                                >
                                    {{ abilities }}
                                </span>

                                <span
                                    v-tippy="{ content: raceItem.source.name }"
                                    class="link-item-expand__tag"
                                >
                                    {{ raceItem.source.shortName }}
                                </span>
                            </span>
                        </span>
                    </a>

                    <button
                        v-if="!isAbilityCalc && hasSubRaces"
                        v-tippy="{ content: 'Разновидности', placement: 'left' }"
                        :class="{ 'is-active': submenu }"
                        class="link-item-expand__toggle"
                        type="button"
                        @click.left.exact.prevent="submenu = !submenu"
                    >
                        <svg-icon
                            :icon-name="submenu ? 'minus' : 'plus'"
                            :stroke-enable="false"
                            fill-enable
                        />
                    </button>
                </div>

                <div
                    v-if="!isAbilityCalc && hasSubRaces"
                    v-show="submenu"
                    class="link-item-expand__arch-list"
                >
                    <div
                        v-for="(group, groupKey) in subRaces"
                        :key="groupKey"
                        class="link-item-expand__arch-type"
                    >
                        <div class="link-item-expand__arch-type_name">
                            {{ group.name.name }}
                        </div>

                        <div class="link-item-expand__arch-type_items">
                            <router-link
                                v-for="(subRace, subRaceKey) in group.list"
                                :key="subRaceKey"
                                :to="{ path: subRace.url }"
                                class="link-item-expand__arch-item"
                            >
                                <span class="link-item-expand__arch-item_name">{{ subRace.name.rus }}</span>

                                <span class="link-item-expand__arch-item_book">
                                    <span v-tippy="{ content: subRace.source.name }">
                                        {{ subRace.source.shortName }}
                                    </span>

                                    /

                                    <span>{{ subRace.name.eng }}</span>
                                </span>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </router-link>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import {
        computed, defineComponent, ref
    } from 'vue';
    import type { RouteLocationPathRaw } from 'vue-router';
    import {
        useLink, useRoute, useRouter
    } from 'vue-router';
    import isArray from 'lodash/isArray';
    import sortBy from 'lodash/sortBy';
    import groupBy from 'lodash/groupBy';
    import type { TRaceLink } from '@/types/Character/Races.types';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { AbilityType } from '@/types/Tools/AbilityCalc.types';

    export default defineComponent({
        components: { SvgIcon },
        inheritAttrs: false,
        props: {
            to: {
                type: Object as PropType<RouteLocationPathRaw>,
                required: true
            },
            raceItem: {
                type: Object as PropType<TRaceLink>,
                required: true
            },
            isAbilityCalc: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const route = useRoute();
            const router = useRouter();

            const {
                isActive,
                navigate,
                href
            } = useLink(props);

            const uiStore = useUIStore();
            const submenu = ref(false);

            const abilities = computed(() => {
                if (!props.raceItem.abilities.length) {
                    return '';
                }

                if (props.raceItem.abilities.length === 6) {
                    return AbilityType.ALL;
                }

                const abilitiesList = [];

                for (const ability of props.raceItem.abilities) {
                    abilitiesList.push(ability.value
                        ? `${ ability.shortName } ${ ability.value > 0 ? `+${ ability.value }` : ability.value }`
                        : ability.name);
                }

                return abilitiesList.join(', ');
            });

            const subRaces = computed(() => {
                if (props.isAbilityCalc) {
                    return null;
                }

                if (isArray(props.raceItem.subraces)) {
                    return sortBy(
                        Object.values(groupBy(props.raceItem.subraces, o => o.type.name))
                            .map(value => ({
                                name: value[0].type,
                                list: value
                            })),
                        [o => o.name.order]
                    );
                }

                return null;
            });

            const hasSubRaces = computed(() => !!subRaces.value);

            const parentClassList = computed(() => ({
                'router-link-active': isActive.value
                    || route.params.raceName === router.resolve(props.raceItem.url).params.raceName,
                'is-selected': route.name === 'raceDetail',
                'is-green': props.raceItem.type.name.toLowerCase() === 'homebrew',
                'is-fullscreen': uiStore.fullscreen,
                'is-ability-calc': props.isAbilityCalc
            }));

            const selectRace = async () => {
                if (!props.isAbilityCalc) {
                    if (!uiStore.isMobile) {
                        submenu.value = true;
                    }

                    await navigate();

                    return;
                }

                window.open(href.value, '_blank')?.focus();
            };

            return {
                submenu,
                abilities,
                subRaces,
                hasSubRaces,
                parentClassList,
                selectRace
            };
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../../assets/styles/modules/link-item-expand";

    .link-item-expand {
        &__main {
            height: 122px;

            @include media-min($sm) {
                height: 210px;
            }
        }

        &__body {
            height: 100%;

            &_row {
                margin: 0;

                & + & {
                    margin-top: auto;
                }
            }
        }

        &.is-ability-calc {
            height: 100%;

            .link-item-expand {
                &__content {
                    height: 100%;
                }

                &__main {
                    height: 100%;
                }
            }
        }
    }
</style>
