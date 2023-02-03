<template>
    <nav-popover>
        <template #trigger="{ isActive }">
            <div
                :class="{ 'is-active': isActive }"
                class="navbar__btn"
                @click.left.exact.prevent="isShow = !isShow"
            >
                <svg-icon
                    icon-name="search-new"
                    :stroke-enable="false"
                    fill-enable
                />
            </div>
        </template>
    </nav-popover>

    <search-modal v-model="isShow" />
</template>

<script>
    import {
        computed, defineComponent, ref, watchEffect
    } from 'vue';
    import {
        useActiveElement, useEventListener, useMagicKeys
    } from '@vueuse/core';
    import NavPopover from '@/components/UI/menu/NavPopover.vue';
    import SearchModal from '@/components/UI/modals/SearchModal.vue';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default defineComponent({
        components: {
            SvgIcon,
            SearchModal,
            NavPopover
        },
        setup() {
            const isShow = ref(false);
            const activeElement = useActiveElement();

            const onOpenSearch = () => {
                isShow.value = true;
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
                isShow
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
