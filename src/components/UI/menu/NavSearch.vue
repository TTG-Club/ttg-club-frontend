<template>
    <nav-popover>
        <template #trigger="{ isActive }">
            <div
                :class="{ 'is-active': isActive }"
                class="navbar__btn"
                @click.left.exact.prevent="isShowSearch = !isShowSearch"
            >
                <svg-icon
                    icon-name="search-new"
                    :stroke-enable="false"
                    fill-enable
                />
            </div>
        </template>
    </nav-popover>

    <search-modal v-model="isShowSearch" />
</template>

<script>
    import {
        computed, defineComponent, watchEffect
    } from 'vue';
    import {
        useActiveElement, useEventListener, useMagicKeys
    } from '@vueuse/core';
    import { storeToRefs } from 'pinia';
    import NavPopover from '@/components/UI/menu/NavPopover.vue';
    import SearchModal from '@/components/UI/modals/SearchModal.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import { useNavStore } from '@/store/UI/NavStore';

    export default defineComponent({
        components: {
            SvgIcon,
            SearchModal,
            NavPopover
        },
        setup() {
            const navStore = useNavStore();
            const { isShowSearch } = storeToRefs(navStore);
            const activeElement = useActiveElement();

            const onOpenSearch = () => {
                isShowSearch.value = true;
            };

            const keys = useMagicKeys();
            const divide = keys['/'];

            const notUsingInput = computed(() => (
                activeElement.value?.tagName !== 'INPUT'
                && activeElement.value?.tagName !== 'TEXTAREA'
            ));

            watchEffect(() => {
                if (divide.value && notUsingInput.value) {
                    onOpenSearch();
                }
            });

            useEventListener(document, 'open-search', () => {
                onOpenSearch();
            });

            return {
                isShowSearch
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
