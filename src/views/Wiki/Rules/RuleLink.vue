<template>
    <router-link
        :to="{ path: rule.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="ruleItem"
            :class="classList"
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
                                {{ rule.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ rule.name.eng }}]
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>
</template>

<script lang="ts">
    import { useLink } from 'vue-router';
    import { computed, defineComponent } from 'vue';
    import type { PropType } from 'vue';
    import type { RouteLocationPathRaw } from 'vue-router';
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
            rule: {
                type: Object,
                default: () => ({})
            }
        },
        setup(props) {
            const {
                isActive, href, navigate
            } = useLink(props);

            return {
                href,
                navigate,
                classList: computed(() => ({
                    'router-link-active': isActive.value,
                    'is-green': props.rule?.source?.homebrew
                }))
            };
        }
    });
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss"/>
