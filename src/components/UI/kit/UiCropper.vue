<template>
    <transition
        name="fade"
        mode="out-in"
    >
        <div
            v-if="modelValue"
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
                    :class="$style.mover"
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
        </div>
    </transition>
</template>

<script setup lang="ts">
    import {
        computed, ref, watch
    } from 'vue';
    import {
        Position,
        useDraggable,
        useMouse, useVModel, whenever
    } from '@vueuse/core';

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

    const mover = ref<SVGLineElement>();

    const modelValue = useVModel(props, 'modelValue');
    const mouse = useMouse();

    const isResizing = ref(false);
    const isMoving = ref(false);

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

    const { isDragging } = useDraggable(mover, {
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
        cursor: move;
        fill: transparent;
        fill-opacity: 0;
        stroke: transparent;
        stroke-opacity: 0;
        stroke-width: 0;
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
</style>
