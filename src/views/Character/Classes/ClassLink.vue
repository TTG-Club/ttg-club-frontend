<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: classItem.url }"
        custom
        v-bind="$props"
    >
        <div
            ref="classItem"
            :class="getClassList(isActive)"
            class="link-item-expand"
            v-bind="$attrs"
        >
            <div class="link-item-expand__content">
                <img
                    v-lazy="classItem.image"
                    alt="img-bg"
                    class="link-item-expand__content__img-bg"
                >

                <div class="link-item-expand__content__gradient"/>

                <div class="link-item-expand__main">
                    <a
                        :href="href"
                        class="link-item-expand__link"
                        @click.left.prevent.exact="selectClass(navigate)"
                    >

                        <span class="link-item-expand__body">
                            <span class="link-item-expand__body_row">

                                <span
                                    v-if="classItem.icon"
                                    class="link-item-expand__icon"
                                >
                                    <svg-icon
                                        :icon-name="classItem.icon"
                                        :stroke-enable="false"
                                        fill-enable
                                    />
                                </span>

                                <span class="link-item-expand__name">
                                    <span class="link-item-expand__name--rus">
                                        {{ classItem.name.rus }}
                                    </span>

                                    <span class="link-item-expand__name--eng">
                                        {{ classItem.name.eng }}
                                    </span>

                                </span>
                            </span>

                            <span class="link-item-expand__body_row">
                                <span class="link-item-expand__tag">
                                    {{ classItem.dice }}
                                </span>

                                <span
                                    v-tippy="{ content: classItem.source.name }"
                                    class="link-item-expand__tag"
                                >
                                    {{ classItem.source.shortName }}
                                </span>
                            </span>
                        </span>

                    </a>

                    <button
                        v-if="hasArchetypes"
                        v-tippy="{ content: classItem.archetypeName, placement: 'left' }"
                        class="link-item-expand__toggle"
                        type="button"
                        @click.left.exact.prevent="toggleArch"
                    >
                        <svg-icon
                            :icon-name="submenu ? 'minus' : 'plus'"
                            fill-enable
                            :stroke-enable="false"
                        />
                    </button>
                </div>

                <transition
                    name="fade"
                    mode="out-in"
                >
                    <div
                        v-if="hasArchetypes"
                        v-show="submenu"
                        class="link-item-expand__arch-list"
                    >
                        <div
                            v-for="(group, groupKey) in classItem.archetypes"
                            :key="groupKey"
                            class="link-item-expand__arch-type"
                        >
                            <div class="link-item-expand__arch-type_name">
                                {{ group.name.name }}
                            </div>

                            <div class="link-item-expand__arch-type_items">
                                <router-link
                                    v-for="(arch, archKey) in group.list"
                                    :key="archKey"
                                    :to="{ path: arch.url }"
                                    class="link-item-expand__arch-item"
                                >
                                    <span class="link-item-expand__arch-item_name">{{ arch.name.rus }}</span>

                                    <span class="link-item-expand__arch-item_book">
                                        <span v-tippy="{ content: arch.source.name }">
                                            {{ arch.source.shortName }}
                                        </span>

                                        /

                                        <span>{{ arch.name.eng }}</span>
                                    </span>
                                </router-link>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </router-link>
</template>

<script lang="ts">
    import type { RouteLocationPathRaw } from 'vue-router';
    import { defineComponent } from 'vue';
    import type { PropType } from 'vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default defineComponent({
        components: { SvgIcon },
        inheritAttrs: false,
        props: {
            to: {
                type: Object as PropType<RouteLocationPathRaw>,
                required: true
            },
            classItem: {
                type: Object,
                default: () => null,
                required: true
            },
            afterSearch: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                submenu: false
            };
        },
        computed: {
            hasArchetypes() {
                return !!this.classItem?.archetypes?.length;
            }
        },
        watch: {
            afterSearch(value) {
                if (value) {
                    this.submenu = this.afterSearch;

                    return;
                }

                this.submenu = false;
            }
        },
        mounted() {
            this.$nextTick(() => {
                this.submenu = this.$route.params.className === this.$router.resolve(this.classItem.url)
                    ?.params?.className;
            });
        },
        methods: {
            getClassList(isActive: any) {
                return {
                    'router-link-active': isActive
                        || this.$route.params.className === this.$router.resolve(this.classItem.url)?.params?.className,
                    'is-selected': this.$route.name === 'classDetail',
                    'is-green': this.classItem?.source?.homebrew
                };
            },

            toggleArch() {
                this.submenu = !this.submenu;
            },

            selectClass(callback: () => void) {
                this.submenu = true;

                callback();
            }
        }
    });
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item-expand.scss"></style>
