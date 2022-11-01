<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: traitItem.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="traitItem"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="navigate()"
        >
            <div class="link-item__content">
                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ traitItem.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ traitItem.name.eng }}]
                            </div>
                        </div>
                    </div>

                    <div class="link-item__row">
                        <div class="link-item__requirements">
                            {{ traitItem.requirements }}
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>
</template>

<script>
    import { RouterLink } from 'vue-router';
    import { useTraitsStore } from "@/store/Character/TraitsStore";

    export default {
        name: 'TraitLink',
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            traitItem: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            traitsStore: useTraitsStore(),
            trait: {
                show: false,
                data: undefined
            }
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-trait-selected': this.$route.name === 'traitDetail',
                    'is-green': this.traitItem?.homebrew
                };
            },

            clickHandler(callback) {
                if (!this.inTab) {
                    callback();

                    return;
                }

                this.traitsStore.traitInfoQuery(this.traitItem.url)
                    .then(spell => {
                        this.trait = {
                            show: true,
                            data: spell
                        };
                    });
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import '../../../assets/styles/modules/link-item';

    .link-item {
        &__requirements {
            color: var(--text-g-color);
            font-size: calc(var(--main-font-size) - 1px);
            line-height: normal;
        }

        &.router-link-active {
            .link-item {
                &__requirements {
                    color: var(--text-btn-color);
                }
            }
        }
    }
</style>
