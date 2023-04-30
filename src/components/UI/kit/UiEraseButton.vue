<template>
    <button
        v-tippy="{ content: 'Стереть строку поиска' }"
        class="filter__search_clear"
        type="button"
        @click.prevent="$emit('click')"
    >
        <svg-icon icon-name="close" />
    </button>
</template>

<script>
    import { defineComponent } from 'vue';
    import SvgIcon from "@/components/UI/icons/SvgIcon.vue";

    export default defineComponent({
        components: {
            SvgIcon
        }
    });
</script>

<style lang="scss" scoped>
.filter__search_clear {
    @include css_anim();

    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    color: var(--primary);

    @include media-min($md) {
        &:hover {
            color: var(--text-btn-color);
            background-color: var(--primary-hover);
        }
    }

    svg {
        width: 16px;
        height: 16px;
    }
}
</style>
