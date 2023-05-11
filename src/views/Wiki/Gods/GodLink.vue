<template>
    <router-link
        :to="{ path: god.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="god"
            :class="classList"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="navigate()"
        >
            <div class="link-item__content">
                <div
                    v-tippy-lazy="{ content: god.alignment }"
                    class="link-item__alignment"
                >
                    <span>{{ god.shortAlignment }}</span>
                </div>

                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <span class="link-item__name--rus">
                                {{ god.name.rus }}
                            </span>

                            <span class="link-item__name--eng">
                                [{{ god.name.eng }}]
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
            god: {
                type: Object,
                default: () => ({})
            }
        },
        setup(props) {
            const {
                isActive,
                href,
                navigate
            } = useLink(props);

            return {
                href,
                navigate,
                classList: computed(() => ({
                    'router-link-active': isActive.value,
                    'is-green': props.god?.homebrew
                }))
            };
        }
    });
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
            margin-right: 12px;
            margin-left: -8px;

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
