<template>
    <vue-final-modal
        v-slot="{ close }"
        content-class="search-modal"
        esc-to-close
        focus-trap
        v-bind="$attrs"
    >
        <span @click="close">test</span>
    </vue-final-modal>
</template>

<script>
    import { defineComponent } from 'vue';

    export default defineComponent({});
</script>

<style lang="scss" scoped>

</style>
