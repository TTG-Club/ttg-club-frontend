<template>
    <div
        :class="$style['bug-reporter']"
        data-html2canvas-ignore
    >
        <ui-cropper
            v-model="isEnabled"
            @crop="download"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import {
        useMagicKeys, whenever
    } from '@vueuse/core';
    import UiCropper from '@/components/UI/kit/UiCropper.vue';

    const isEnabled = ref(false);

    const keys = useMagicKeys();
    const shiftA = keys['Shift+A'];
    const screenshot = ref<string | null>(null);

    whenever(shiftA, () => {
        screenshot.value = null;
        isEnabled.value = true;
    });
</script>

<style module>
    .bug-reporter {
        position: fixed;
        z-index: 1000000000000000000;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        user-select: none;
    }
</style>
