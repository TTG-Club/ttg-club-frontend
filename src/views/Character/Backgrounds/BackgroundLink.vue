<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: backgroundItem.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="backgroundItem"
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
                                {{ backgroundItem.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ backgroundItem.name.eng }}]
                            </div>
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
    import { useBackgroundsStore } from "@/store/Character/BackgroundsStore";

    export default {
        name: 'BackgroundLink',
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            backgroundItem: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            backgroundsStore: useBackgroundsStore(),
            background: {
                show: false,
                data: undefined
            }
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-green': this.backgroundItem?.homebrew
                };
            },

            clickHandler(callback) {
                if (!this.inTab) {
                    callback();

                    return;
                }

                this.backgroundsStore.backgroundInfoQuery(this.backgroundItem.url)
                    .then(spell => {
                        this.background = {
                            show: true,
                            data: spell
                        };
                    });
            }
        }
    };
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss"/>
