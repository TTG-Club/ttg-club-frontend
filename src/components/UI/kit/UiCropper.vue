<template>
    <div
        v-if="modelValue"
        ref="uiCropper"
        :class="$style['ui-cropper']"
    >
        <svg :class="$style.cropper">
            <mask id="mask">
                <rect
                    fill="white"
                    width="100%"
                    height="100%"
                    fill-opacity="1"
                />

                <rect
                    :x="calcRect.x"
                    :y="calcRect.y"
                    :width="calcRect.width"
                    :height="calcRect.height"
                />
            </mask>

            <rect
                :class="$style.bg"
                width="100%"
                height="100%"
            />

            <rect
                ref="mover"
                :class="{ [$style.mover]: true, [$style['is-grabbed']]: isMoving }"
                :x="calcRect.x"
                :y="calcRect.y"
                :width="calcRect.width"
                :height="calcRect.height"
            />

            <line
                :x1="calcRect.left"
                :x2="calcRect.right"
                :y1="calcRect.top"
                :y2="calcRect.top"
                :class="[$style.line, $style['cursor-ns']]"
            />

            <line
                :x1="calcRect.right"
                :x2="calcRect.right"
                :y1="calcRect.top"
                :y2="calcRect.bottom"
                :class="[$style.line, $style['cursor-ew']]"
            />

            <line
                :x1="calcRect.right"
                :x2="calcRect.left"
                :y1="calcRect.bottom"
                :y2="calcRect.bottom"
                :class="[$style.line, $style['cursor-ns']]"
            />

            <line
                :x1="calcRect.left"
                :x2="calcRect.left"
                :y1="calcRect.bottom"
                :y2="calcRect.top"
                :class="[$style.line, $style['cursor-ew']]"
            />

            <circle
                :class="[$style.dot, $style['cursor-nwse']]"
                :cx="calcRect.left"
                :cy="calcRect.top"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-ns']]"
                :cx="calcRect.centerX"
                :cy="calcRect.top"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-nesw']]"
                :cx="calcRect.right"
                :cy="calcRect.top"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-ew']]"
                :cx="calcRect.left"
                :cy="calcRect.centerY"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-ew']]"
                :cx="calcRect.right"
                :cy="calcRect.centerY"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-nesw']]"
                :cx="calcRect.left"
                :cy="calcRect.bottom"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-ns']]"
                :cx="calcRect.centerX"
                :cy="calcRect.bottom"
                r="4"
            />

            <circle
                :class="[$style.dot, $style['cursor-nwse']]"
                :cx="calcRect.right"
                :cy="calcRect.bottom"
                r="4"
            />
        </svg>

        <ui-button
            :class="$style.apply"
            is-large
            @click.left.exact.prevent="takeScreenshot"
        >
            Применить
        </ui-button>
    </div>
</template>

<script setup lang="ts">
    import {
        computed, ref, watch
    } from 'vue';
    import {
        onKeyStroke,
        useDraggable,
        useMouse, useVModel, whenever
    } from '@vueuse/core';
    import type { Position } from '@vueuse/core';
    import html2canvas from 'html2canvas';
    import UiButton from '@/components/UI/kit/UiButton.vue';

    interface IRect {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    interface IRectCalc extends IRect {
        top: number;
        left: number;
        right: number;
        bottom: number;
        centerX: number;
        centerY: number;
    }

    interface IProp {
        modelValue: boolean;
    }

    interface IEmit {
        (e: 'update:modelValue', value: boolean): void;
        (e: 'resize', value: IRectCalc): void;
    }

    const props = withDefaults(defineProps<IProp>(), {
        modelValue: false
    });

    const emit = defineEmits<IEmit>();

    const uiCropper = ref();
    const mover = ref<SVGRectElement>();

    const modelValue = useVModel(props, 'modelValue');
    const mouse = useMouse();

    const inProgress = ref(false);
    const isResizing = ref(false);

    const rect = ref<IRect>({
        x: 256,
        y: 256,
        width: 256,
        height: 256
    });

    const calcRect = computed<IRectCalc>(() => ({
        ...rect.value,
        top: rect.value.y,
        left: rect.value.x,
        right: rect.value.x + rect.value.width,
        bottom: rect.value.y + rect.value.height,
        centerX: rect.value.width / 2 + rect.value.x,
        centerY: rect.value.height / 2 + rect.value.y
    }));

    const moveHandler = (position: Position) => {
        rect.value = {
            ...rect.value,
            ...position
        };
    };

    onKeyStroke('Escape', e => {
        if (!modelValue.value) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        modelValue.value = false;
    });

    const { isDragging: isMoving } = useDraggable(mover, {
        preventDefault: true,
        stopPropagation: true,
        onMove: position => moveHandler(position)
    });

    whenever(modelValue, () => {
        rect.value = {
            x: mouse.x.value - 128,
            y: mouse.y.value - 128,
            width: 256,
            height: 256
        };
    });

    const takeScreenshot = async () => {
        try {
            const canvas = await html2canvas(document.body, {
                ...rect.value,
                allowTaint: true,
                useCORS: true
            });

            canvas.getContext('2d');

            const imgSrc = canvas.toDataURL('image/png', 0.5);
            const createEl = document.createElement('a');

            createEl.href = imgSrc;
            createEl.download = "download-this-canvas";

            createEl.click();
            createEl.remove();

            return imgSrc;
        } catch (err) {
            return Promise.reject(err);
        } finally {
            modelValue.value = false;
        }
    };

    watch<IRectCalc>(calcRect, value => {
        emit('resize', value);
    });
</script>

<style module>
    .ui-cropper {
        position: fixed;
        z-index: 1000000000000000000;
        width: 100vw;
        height: 100vh;
        pointer-events: initial;
    }

    .hidden {
        opacity: 0 !important;
    }

    .cropper {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .bg {
        fill: var(--bg-main);
        fill-opacity: .7;
        width: 100%;
        height: 100%;
        mask: url("#mask");
    }

    .line {
        stroke-width: 2;
        stroke-opacity: 1;
        stroke: var(--bg-dice);
    }

    .dot {
        fill: var(--bg-dice);
        stroke-width: 0;
    }

    .mover {
        cursor: grab;
        fill: transparent;
        fill-opacity: 0;
        stroke: transparent;
        stroke-opacity: 0;
        stroke-width: 0;
    }

    .mover.is-grabbed {
        cursor: grabbing;
    }

    .cursor-nwse {
        cursor: nwse-resize;
    }

    .cursor-ew {
        cursor: ew-resize;
    }

    .cursor-ns {
        cursor: ns-resize;
    }

    .cursor-nesw {
        cursor: nesw-resize;
    }

    .apply {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
    }
</style>
