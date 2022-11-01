<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: god.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="god"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="navigate()"
        >
            <div class="link-item__content">
                <div
                    v-tippy="{ content: god.alignment }"
                    class="link-item__alignment"
                >
                    <span>{{ god.shortAlignment }}</span>
                </div>

                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ god.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ god.name.eng }}]
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
    import { useGodsStore } from "@/store/Wiki/GodsStore";

    export default {
        name: 'GodLink',
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            god: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            godsStore: useGodsStore()
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-green': this.god?.source?.homebrew,
                    'in-tab': this.inTab
                };
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import "../../../assets/styles/modules/link-item";

    .link-item {
        &__alignment {
            width: 42px;
            flex-shrink: 0;
            font-size: 17px;
            color: var(--text-color);
            border-right: 1px solid var(--border);
            margin-right: 16px;

            span {
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }
</style>
