<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: spell.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="spell"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler(navigate)"
        >
            <div class="link-item__content">
                <div
                    v-tippy="{ content: spell.level ? `${spell.level} уровень заклинания` : 'Заговор' }"
                    class="link-item__lvl"
                >
                    <span>{{ spell.level || '◐' }}</span>
                </div>

                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ spell.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ spell.name.eng }}]
                            </div>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <div
                            v-if="spell.concentration || spell.ritual"
                            class="link-item__modifications"
                        >
                            <div
                                v-if="spell.concentration"
                                v-tippy="{ content: 'Концентрация' }"
                                class="link-item__modification"
                            >
                                К
                            </div>

                            <div
                                v-if="spell.ritual"
                                v-tippy="{ content: 'Ритуал' }"
                                class="link-item__modification"
                            >
                                Р
                            </div>
                        </div>

                        <div
                            v-capitalize-first
                            class="link-item__school"
                        >
                            {{ spell.school }}
                        </div>

                        <div
                            class="link-item__components"
                        >
                            <div
                                v-tippy="{ content: 'Вербальный', onShow() { return !!spell?.components?.v } }"
                                class="link-item__component"
                            >
                                {{ spell?.components?.v ? 'В' : '·' }}
                            </div>

                            <div
                                v-tippy="{ content: 'Соматический', onShow() { return !!spell?.components?.s } }"
                                class="link-item__component"
                            >
                                {{ spell?.components?.s ? 'С' : '·' }}
                            </div>

                            <div
                                v-tippy="{ content: 'Материальный', onShow() { return !!spell?.components?.m } }"
                                class="link-item__component"
                            >
                                {{ !!spell?.components?.m ? 'М' : '·' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>

    <base-modal
        v-if="spellModal.data"
        v-model="spellModal.show"
        :bookmark="bookmarkObj"
    >
        <template #title>
            {{ spellModal.data.name.rus }}
        </template>

        <template #default>
            <spell-body :spell="spellModal.data"/>
        </template>
    </base-modal>
</template>

<script>
    import { RouterLink } from 'vue-router';
    import { mapActions, mapState } from "pinia";
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';
    import { useSpellsStore } from "@/store/Spells/SpellsStore";
    import SpellBody from "@/views/Spells/SpellBody.vue";
    import BaseModal from "@/components/UI/modals/BaseModal.vue";
    import { useDefaultBookmarkStore } from "@/store/UI/bookmarks/DefaultBookmarkStore";

    export default {

        components: {
            BaseModal,
            SpellBody
        },
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            spell: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            spellsStore: useSpellsStore(),
            spellModal: {
                show: false,
                data: undefined
            }
        }),
        computed: {
            ...mapState(useDefaultBookmarkStore, ['isBookmarkSaved']),

            hasComponents() {
                const { spell } = this;

                return spell?.components?.v || spell?.components?.s || !!spell?.components?.m;
            },

            bookmarkObj() {
                return {
                    url: this.spell.url,
                    name: this.spell.name.rus
                };
            }
        },
        methods: {
            ...mapActions(useDefaultBookmarkStore, ['updateBookmark']),

            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-green': this.spell?.source?.homebrew,
                    'in-tab': this.inTab
                };
            },

            async clickHandler(callback) {
                if (!this.inTab) {
                    callback();

                    return;
                }

                try {
                    if (!this.spellModal.data) {
                        this.spellModal.data = await this.spellsStore.spellInfoQuery(this.spell.url);
                    }

                    this.spellModal.show = true;
                } catch (err) {
                    console.error(err);
                }
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import "../../assets/styles/modules/link-item";

    .link-item {
        &__lvl {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 17px;
            color: var(--text-color);
            border-right: 1px solid var(--border);
            margin-right: 12px;
        }

        &__modifications {
            display: flex;
            margin-right: 8px;
        }

        &__modification {
            padding: 0 6px;
            border-radius: 6px;
            background-color: var(--primary);
            color: var(--text-btn-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;

            & + & {
                margin-left: 4px;
            }
        }

        &__school {
            color: var(--text-g-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
        }

        &__components {
            display: flex;
            margin-left: auto;
        }

        &__component {
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
            color: var(--text-color);
            width: 10px;
            text-align: center;

            & + & {
                margin-left: 4px;
            }
        }

        &.router-link-active {
            .link-item {
                &__lvl,
                &__modification,
                &__school,
                &__component {
                    color: var(--text-btn-color);
                }
            }
        }
    }
</style>
