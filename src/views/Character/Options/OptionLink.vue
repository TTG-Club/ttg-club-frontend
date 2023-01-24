<template>
    <router-link
        :to="{ path: optionItem.url }"
        custom
        v-bind="$props"
    >
        <a
            ref="optionItem"
            :class="classList"
            :href="href"
            class="link-item"
            v-bind="$attrs"
            @click.left.exact.prevent="clickHandler"
        >
            <div class="link-item__content">
                <div class="link-item__body">
                    <div class="link-item__row">
                        <div class="link-item__name">
                            <p class="link-item__name--rus">
                                {{ optionItem.name.rus }}
                            </p>

                            <p class="link-item__name--eng">
                                [{{ optionItem.name.eng }}]
                            </p>
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
            <option-body :option="modal.data" />
        </template>
    </base-modal>
</template>

<script lang="ts">
    import type { RouteLocationPathRaw } from 'vue-router';
    import { useLink } from 'vue-router';
    import type { PropType } from 'vue';
    import {
        computed, defineComponent, ref
    } from 'vue';
    import { CapitalizeFirst } from '@/common/directives/CapitalizeFirst';
    import BaseModal from '@/components/UI/modals/BaseModal.vue';
    import OptionBody from '@/views/Character/Options/OptionBody.vue';
    import { useAxios } from '@/common/composition/useAxios';

    export default defineComponent({
        components: {
            OptionBody,
            BaseModal
        },
        directives: {
            CapitalizeFirst
        },
        inheritAttrs: false,
        props: {
            to: {
                type: Object as PropType<RouteLocationPathRaw>,
                required: true
            },
            optionItem: {
                type: Object,
                default: () => ({})
            },
            inTab: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const http = useAxios();

            const {
                navigate,
                isActive,
                href
            } = useLink(props);

            const modal = ref({
                show: false,
                data: undefined
            });

            const bookmarkObj = computed(() => ({
                url: props.optionItem.url,
                name: props.optionItem.name.rus
            }));

            const classList = computed(() => ({
                'router-link-active': isActive.value,
                'is-green': props.optionItem?.homebrew
            }));

            const clickHandler = async () => {
                if (!props.inTab) {
                    await navigate();

                    return;
                }

                try {
                    if (!modal.value.data) {
                        const resp = await http.post({
                            url: props.optionItem.url
                        });

                        modal.value.data = resp.data;
                    }

                    modal.value.show = true;
                } catch (err) {
                    console.error(err);
                }
            };

            return {
                href,
                modal,
                bookmarkObj,
                classList,
                clickHandler
            };
        }
    });
</script>

<style lang="scss" scoped src="../../../assets/styles/modules/link-item.scss" />
