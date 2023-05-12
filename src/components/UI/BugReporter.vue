<template>
    <ui-cropper v-model="isEnabled" />
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

    const div = ref<HTMLDivElement>();

    // const takeScreenshot = () => {
    //     const img = new Image();
    //     const canvas = document.createElement('canvas');
    //     const ctx = canvas.getContext('2d');
    //
    //     // const rect = {
    //     //     width: rects.value[0].width + 48,
    //     //     height: rects.value[0].height + 48,
    //     //     x: rects.value[0].x - 24,
    //     //     y: rects.value[0].y - 24
    //     // };
    //     //
    //     // canvas.width = rect.width;
    //     // canvas.height = rect.height;
    //     // canvas.id = 'bug-reporter';
    //     //
    //     // ctx!.drawImage(canvas, rect.x, rect.y, rect.width, rect.height);
    //     //
    //     // screenshot.value = canvas.toDataURL("image/png", 0.5);
    //     // img.src = canvas.toDataURL("image/png", 0.5);
    //     //
    //     // div.value?.appendChild(canvas);
    //
    //     // Download
    //
    //     // img.onload = () => {
    //     //     const createEl = document.createElement('a');
    //     //
    //     //     createEl.href = img.src;
    //     //
    //     //     createEl.download = "download-this-canvas";
    //     //
    //     //     createEl.click();
    //     //     createEl.remove();
    //     // };
    // };

    whenever(shiftA, () => {
        isEnabled.value = true;
    });
</script>

<style module>
    .bug-reporter {
        position: fixed;
        z-index: 1000000000000000000;
        width: 100vw;
        height: 100vh;
    }
</style>
