<template>
    <router-link
        :to="{ path: book.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="bookItem"
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
                            <p class="link-item__name--rus">
                                {{ book.name.rus }}
                            </p>

                            <p class="link-item__name--eng">
                                [{{ book.name.eng }}]
                            </p>
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
            book: {
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
                    'is-green': props.book?.source?.homebrew
                }))
            };
        }
    });
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
