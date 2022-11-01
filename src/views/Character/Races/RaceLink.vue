<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        v-bind="$props"
        :to="{ path: raceItem.url }"
        custom
    >
        <div
            ref="raceItem"
            class="link-item-expand"
            :class="getParentClasses(isActive)"
            v-bind="$attrs"
        >
            <div class="link-item-expand__content">
                <img
                    v-lazy="raceItem.image"
                    alt="img-bg"
                    class="link-item-expand__content__img-bg"
                >

                <div class="link-item-expand__content__gradient"/>

                <div class="link-item-expand__main">
                    <a
                        :href="href"
                        class="link-item-expand__link"
                        @click.left.prevent.exact="selectRace(navigate)"
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
                        v-if="hasSubraces"
                        v-tippy="{ content: 'Разновидности', placement: 'left' }"
                        :class="{ 'is-active': submenu }"
                        class="link-item-expand__toggle"
                        type="button"
                        @click.left.exact.prevent="toggleSubrace"
                    >
                        <svg-icon :icon-name="submenu ? 'minus' : 'plus'"/>
                    </button>
                </div>

                <div
                    v-if="hasSubraces"
                    v-show="submenu"
                    class="link-item-expand__arch-list"
                >
                    <div
                        v-for="(group, groupKey) in raceItem.subraces"
                        :key="groupKey"
                        class="link-item-expand__arch-type"
                    >
                        <div class="link-item-expand__arch-type_name">
                            {{ group.name.name }}
                        </div>

                        <div class="link-item-expand__arch-type_items">
                            <router-link
                                v-for="(subrace, subraceKey) in group.list"
                                :key="subraceKey"
                                :to="{ path: subrace.url }"
                                class="link-item-expand__arch-item"
                            >
                                <span class="link-item-expand__arch-item_name">{{ subrace.name.rus }}</span>

                                <span class="link-item-expand__arch-item_book">
                                    <span v-tippy="{ content: subrace.source.name }">
                                        {{ subrace.source.shortName }}
                                    </span>

                                    /

                                    <span>{{ subrace.name.eng }}</span>
                                </span>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </router-link>
</template>

<script>
    import { RouterLink } from 'vue-router';
    import { mapState } from "pinia";
    import SvgIcon from '@/components/UI/icons/SvgIcon';
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'RaceLink',
        components: { SvgIcon },
        inheritAttrs: false,
        props: {
            raceItem: {
                type: Object,
                default: () => null,
                required: true
            },
            ...RouterLink.props
        },
        data() {
            return {
                submenu: false
            };
        },
        computed: {
            ...mapState(useUIStore, ['fullscreen']),

            hasSubraces() {
                return !!this.raceItem?.subraces?.length;
            },

            abilities() {
                if (!this.raceItem.abilities?.length) {
                    return '';
                }

                const abilities = [];

                for (const ability of this.raceItem.abilities) {
                    abilities.push(ability.value
                        ? `${ ability.shortName } ${ ability.value > 0 ? `+${ ability.value }` : ability.value }`
                        : ability.name);
                }

                return abilities.join(', ');
            }
        },
        methods: {
            getParentClasses(isActive) {
                return {
                    'router-link-active': isActive
                        || this.$route.params.raceName === this.$router.resolve(this.raceItem.url)?.params?.raceName,
                    'is-selected': this.$route.name === 'raceDetail',
                    'is-green': this.raceItem.type?.name.toLowerCase() === 'homebrew',
                    'is-fullscreen': this.fullscreen
                };
            },

            toggleSubrace() {
                this.submenu = !this.submenu;
            },

            selectRace(callback) {
                this.submenu = true;

                callback();
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import "../../../assets/styles/modules/link-item-expand";

    .link-item-expand {
        &__body {
            &_row {
                &:first-child {
                    margin-bottom: 20px;

                    @include media-min($sm) {
                        margin-bottom: 110px;
                    }
                }
            }
        }
    }
</style>
