<template>
    <div class="content-detail">
        <div class="content-detail__fixed">
            <slot name="fixed" />
        </div>

        <div class="content-detail__body">
            <slot name="default" />
        </div>
    </div>
</template>

<script>
    export default {
        name: 'ContentDetail'
    };
</script>

<style lang="scss" scoped>
    .content-detail {
        display: flex;
        flex-direction: column;
        height: 100%;

        &__fixed,
        &__body {
            width: 100%;
            display: block;
        }

        &__fixed {
            flex-shrink: 0;
        }

        &__body {
            overflow: auto;
            flex: 1 1 100%;
        }
    }
</style>
