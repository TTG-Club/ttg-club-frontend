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
    import { defineComponent, ref } from 'vue';
    import NavPopover from '@/components/UI/menu/NavPopover.vue';
    import SearchModal from '@/components/UI/modals/SearchModal.vue';

    export default defineComponent({
        components: {
            SearchModal,
            NavPopover
        },
        setup() {
            const isShow = ref(false);

            return {
                isShow
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
