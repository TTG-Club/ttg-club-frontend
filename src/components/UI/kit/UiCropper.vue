<template>
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
                :class="{ [$style.mover]: true, [$style['is-grabbed']]: isMoving }"
                :x="calcRect.x"
                :y="calcRect.y"
                :width="calcRect.width"
                :height="calcRect.height"
            />

            <line
                ref="nsTopLineResizer"
                :x1="calcRect.left"
                :x2="calcRect.right"
                :y1="calcRect.top"
                :y2="calcRect.top"
                :class="[$style.line, $style['cursor-ns']]"
            />

            <line
                ref="ewRightLineResizer"
                :x1="calcRect.right"
                :x2="calcRect.right"
                :y1="calcRect.top"
                :y2="calcRect.bottom"
                :class="[$style.line, $style['cursor-ew']]"
            />

            <line
                ref="nsBottomLineResizer"
                :x1="calcRect.right"
                :x2="calcRect.left"
                :y1="calcRect.bottom"
                :y2="calcRect.bottom"
                :class="[$style.line, $style['cursor-ns']]"
            />

            <line
                ref="ewLeftLineResizer"
                :x1="calcRect.left"
                :x2="calcRect.left"
                :y1="calcRect.bottom"
                :y2="calcRect.top"
                :class="[$style.line, $style['cursor-ew']]"
            />

            <circle
                ref="nwseTopResizer"
                :class="[$style.dot, $style['cursor-nwse']]"
                :cx="calcRect.left"
                :cy="calcRect.top"
                r="4"
            />

            <circle
                ref="nsTopResizer"
                :class="[$style.dot, $style['cursor-ns']]"
                :cx="calcRect.centerX"
                :cy="calcRect.top"
                r="4"
            />

            <circle
                ref="neswTopResizer"
                :class="[$style.dot, $style['cursor-nesw']]"
                :cx="calcRect.right"
                :cy="calcRect.top"
                r="4"
            />

            <circle
                ref="ewLeftResizer"
                :class="[$style.dot, $style['cursor-ew']]"
                :cx="calcRect.left"
                :cy="calcRect.centerY"
                r="4"
            />

            <circle
                ref="ewRightResizer"
                :class="[$style.dot, $style['cursor-ew']]"
                :cx="calcRect.right"
                :cy="calcRect.centerY"
                r="4"
            />

            <circle
                ref="neswBottomResizer"
                :class="[$style.dot, $style['cursor-nesw']]"
                :cx="calcRect.left"
                :cy="calcRect.bottom"
                r="4"
            />

            <circle
                ref="nsBottomResizer"
                :class="[$style.dot, $style['cursor-ns']]"
                :cx="calcRect.centerX"
                :cy="calcRect.bottom"
                r="4"
            />

            <circle
                ref="nwseBottomResizer"
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
        onKeyStroke, Position,
        useDraggable,
        useMouse, useVModel, whenever
    } from '@vueuse/core';
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

    const modelValue = useVModel(props, 'modelValue');
    const mouse = useMouse();

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

    onKeyStroke('Escape', e => {
        if (!modelValue.value) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        modelValue.value = false;
    });

    const onMoveHandler = (position: Position, size?: {width: number, height: number}) => {
        const getPositionX = () => {
            if (position.x <= 0) {
                return 0;
            }

            if (position.x + rect.value.width >= window.innerWidth) {
                return window.innerWidth - rect.value.width;
            }

            return position.x;
        };

        const getPositionY = () => {
            if (position.y <= 0) {
                return 0;
            }

            if (position.y + rect.value.height >= window.innerHeight) {
                return window.innerHeight - rect.value.height;
            }

            return position.y;
        };

        rect.value = {
            x: getPositionX(),
            y: getPositionY(),
            width: size?.width || rect.value.width,
            height: size?.height || rect.value.height
        };
    };

    whenever(modelValue, () => {
        const size = {
            width: 256,
            height: 256
        };

        const position = {
            x: mouse.x.value - size.width / 2,
            y: mouse.y.value - size.height / 2
        };

        onMoveHandler(position, size);
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

    // resizer
    const mover = ref<SVGRectElement>();

    const nsTopLineResizer = ref<SVGLineElement>();
    const ewRightLineResizer = ref<SVGLineElement>();
    const nsBottomLineResizer = ref<SVGLineElement>();
    const ewLeftLineResizer = ref<SVGLineElement>();

    const nwseTopResizer = ref<SVGCircleElement>();
    const nsTopResizer = ref<SVGCircleElement>();
    const neswTopResizer = ref<SVGCircleElement>();
    const ewLeftResizer = ref<SVGCircleElement>();
    const ewRightResizer = ref<SVGCircleElement>();
    const neswBottomResizer = ref<SVGCircleElement>();
    const nsBottomResizer = ref<SVGCircleElement>();
    const nwseBottomResizer = ref<SVGCircleElement>();

    const { isDragging: isMoving } = useDraggable(mover, {
        preventDefault: true,
        stopPropagation: true,
        onMove: position => onMoveHandler(position)
    });

    const nsTopResizeHandler = (position: Position) => {
        if (position.y <= 0) {
            rect.value = {
                ...rect.value,
                y: 0,
                height: calcRect.value.bottom
            };

            return;
        }

        const max = calcRect.value.bottom - 24;
        const delta = rect.value.y - position.y;

        rect.value = {
            ...rect.value,
            y: position.y > max ? max : position.y,
            height: position.y > max ? 24 : rect.value.height + delta
        };
    };

    const nsBottomResizeHandler = (position: Position) => {
        if (position.y >= window.innerHeight) {
            rect.value = {
                ...rect.value,
                height: window.innerHeight - rect.value.y
            };

            return;
        }

        const height = position.y - rect.value.y;

        rect.value = {
            ...rect.value,
            height: height <= 24 ? 24 : height
        };
    };

    const ewLeftResizeHandler = (position: Position) => {
        if (position.x <= 0) {
            rect.value = {
                ...rect.value,
                x: 0,
                width: calcRect.value.right
            };

            return;
        }

        const max = calcRect.value.right - 24;
        const delta = rect.value.x - position.x;

        rect.value = {
            ...rect.value,
            x: position.x > max ? max : position.x,
            width: position.x > max ? 24 : rect.value.width + delta
        };
    };

    const ewRightResizeHandler = (position: Position) => {
        if (position.x >= window.innerWidth) {
            rect.value = {
                ...rect.value,
                width: window.innerWidth - rect.value.x
            };

            return;
        }

        const width = position.x - rect.value.x;

        rect.value = {
            ...rect.value,
            width: width <= 24 ? 24 : width
        };
    };

    // Resizing by lines
    useDraggable(nsTopLineResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: nsTopResizeHandler
    });

    useDraggable(ewRightLineResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: ewRightResizeHandler
    });

    useDraggable(nsBottomLineResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: nsBottomResizeHandler
    });

    useDraggable(ewLeftLineResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: ewLeftResizeHandler
    });

    // Resizing by dots on lines
    useDraggable(nsTopResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: nsTopResizeHandler
    });

    useDraggable(ewRightResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: ewRightResizeHandler
    });

    useDraggable(nsBottomResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: nsBottomResizeHandler
    });

    useDraggable(ewLeftResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: ewLeftResizeHandler
    });

    // Resizing by dots on angles
    useDraggable(nwseTopResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: position => {
            nsTopResizeHandler(position);
            ewLeftResizeHandler(position);
        }
    });

    useDraggable(neswTopResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: position => {
            nsTopResizeHandler(position);
            ewRightResizeHandler(position);
        }
    });

    useDraggable(nwseBottomResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: position => {
            nsBottomResizeHandler(position);
            ewRightResizeHandler(position);
        }
    });

    useDraggable(neswBottomResizer, {
        preventDefault: true,
        stopPropagation: true,
        onMove: position => {
            nsBottomResizeHandler(position);
            ewLeftResizeHandler(position);
        }
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
