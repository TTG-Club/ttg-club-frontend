<template>
    <div class="icon-toast-close">
        <svg-icon icon-name="close"/>
    </div>
</template>

<script>
    import { defineComponent } from "vue";
    import SvgIcon from "@/components/UI/icons/SvgIcon";

    export default defineComponent({
        components: {
            SvgIcon
        }
    });
</script>

<style lang="scss" scoped>
    .icon-toast-close {
        @include css_anim();

        opacity: 1;
        border-radius: 8px;

        &:hover {
            background-color: var(--hover);
        }
    }
</style>
