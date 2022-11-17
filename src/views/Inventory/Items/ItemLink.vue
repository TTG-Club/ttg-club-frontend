<template>
    <router-link
        v-slot="{ href, navigate, isActive }"
        :to="{ path: itemItem.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="itemItem"
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
                                {{ itemItem.name.rus }}
                            </div>

                            <div class="link-item__name--eng">
                                [{{ itemItem.name.eng }}]
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
    import { useItemsStore } from "@/store/Inventory/ItemsStore";

    export default {

        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            ...RouterLink.props,
            itemItem: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        data: () => ({
            itemsStore: useItemsStore(),
            item: {
                show: false,
                data: undefined
            }
        }),
        methods: {
            getClassList(isActive) {
                return {
                    'router-link-active': isActive,
                    'is-item-selected': this.$route.name === 'itemDetail',
                    'is-green': this.itemItem?.homebrew
                };
            },

            clickHandler(callback) {
                if (!this.inTab) {
                    callback();

                    return;
                }

                this.itemsStore.itemInfoQuery(this.itemItem.url)
                    .then(spell => {
                        this.item = {
                            show: true,
                            data: spell
                        };
                    });
            }
        }
    };
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss"/>
