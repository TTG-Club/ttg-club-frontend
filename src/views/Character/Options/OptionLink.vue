<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: optionItem.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="optionItem"
            :class="getClassList(isActive)"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler(navigate)"
        >
            <div class="link-item__content">
                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <div class="link-item__name--rus">
                                {{ optionItem.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ optionItem.name.eng }}]
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    </router-link>

    <base-modal
        v-if="modal.data"
        v-model="modal.show"
        :bookmark="bookmarkObj"
    >
        <template #title>
            {{ modal.data.name.rus }}
        </template>

        <template #default>
            <option-body :option="modal.data"/>
        </template>
    </base-modal>
</template>

<script>
    import { RouterLink } from 'vue-router';
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';
    import { useOptionsStore } from "@/store/Character/OptionsStore";
    import BaseModal from "@/components/UI/modals/BaseModal.vue";
    import OptionBody from "@/views/Character/Options/OptionBody.vue";

    export default {
        name: 'OptionLink',
        components: {
            OptionBody,
            BaseModal
        },
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            optionItem: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            optionsStore: useOptionsStore(),
            modal: {
                show: false,
                data: undefined
            }
        }),
        computed: {
            bookmarkObj() {
                return {
                    url: this.optionItem.url,
                    name: this.optionItem.name.rus
                };
            }
        },
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-option-selected': this.$route.name === 'optionDetail',
                    'is-green': this.optionItem?.homebrew
                };
            },

            async clickHandler(callback) {
                if (!this.inTab) {
                    callback();

                    return;
                }

                try {
                    if (!this.modal.data) {
                        this.modal.data = await this.optionsStore.optionInfoQuery(this.optionItem.url);
                    }

                    this.modal.show = true;
                } catch (err) {
                    console.error(err);
                }
            }
        }
    };
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss"/>
