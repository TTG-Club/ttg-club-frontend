<template>
    <div
        class="nav-popover__trigger"
        :class="{ 'is-active': show.layer }"
    >
        <slot
            :set-ref="setTrigger"
            :is-active="show.layer"
            name="trigger"
        />
    </div>

    <transition
        name="fade"
        mode="out-in"
        @after-enter="show.body = true"
    >
        <div
            v-if="show.layer"
            class="nav-popover"
            @click.left.exact.self.prevent="emitClose"
        >
            <div
                ref="body"
                class="nav-popover__wrapper"
                :style="position"
            >
                <transition
                    name="nav-popover-animation"
                    :class="{ 'is-left': isLeft }"
                    @after-leave="show.layer = false"
                >
                    <div
                        v-if="show.body"
                        class="nav-popover__body"
                        :style="{ maxHeight }"
                    >
                        <slot
                            name="default"
                            :close="emitClose"
                        />
                    </div>
                </transition>
            </div>
        </div>
    </transition>
</template>

<script setup>
    import { useElementBounding } from "@vueuse/core";
    import {
        reactive, ref, watch
    } from "vue";

    let rectTrigger;

    const emit = defineEmits(['update:model-value', 'close']);

    const props = defineProps({
        modelValue: {
            type: Boolean,
            default: false
        },
        isMenu: {
            type: Boolean,
            default: false
        },
        isLeft: {
            type: Boolean,
            default: false
        }
    });

    const body = ref(null);

    const show = reactive({
        layer: false,
        body: false
    });

    const rectBody = useElementBounding(body);
    const position = reactive({});
    const maxHeight = ref('calc(var(--max-vh) / 100 * 90)');

    function setPosition() {
        rectBody.update();

        if (!rectTrigger) {
            return;
        }

        if (!props.isMenu) {
            maxHeight.value = `calc(var(--max-vh) - ${ rectTrigger.bottom.value + 4 }px - 8px)`;
        }

        position.top = `${ props.isMenu ? rectTrigger.top.value : rectTrigger.bottom.value + 4 }px`;
        position.height = maxHeight.value;
        position.maxHeight = maxHeight.value;

        if (props.isLeft) {
            position.left = `${ rectTrigger.left.value }px`;
        }

        if (!props.isLeft) {
            position.left = `${ rectTrigger.right.value - rectBody.width.value }px`;
        }
    }

    function setTrigger(el) {
        rectTrigger = useElementBounding(el);

        setPosition();
    }

    function emitClose() {
        emit('update:model-value', false);
        emit('close');
    }

    watch(
        () => props.modelValue,
        value => {
            if (value) {
                show.layer = true;
            }

            if (!value) {
                show.body = false;
            }
        }
    );

    watch(
        [
            () => rectTrigger?.top,
            () => rectTrigger?.left,
            () => rectBody?.width
        ],
        setPosition
    );
</script>

<style lang="scss" scoped>
    .nav-popover {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: var(--max-vh);
        background-color: var(--bg-light-main);
        transform: translate3d(0, 0, 0);
        z-index: 110;
        cursor: pointer;

        &__trigger {
            &.is-active {
                z-index: 120;
            }
        }

        &__wrapper {
            max-width: 800px;
            z-index: 111;
            position: relative;
            display: inline-block;
            pointer-events: none;

            @media (max-width: 800px) {
                max-width: 550px;
            }

            @media (max-width: 550px) {
                max-width: none;
                max-height: none;
                width: calc(100% - 16px);
                height: calc(100% - 16px);
                left: 8px !important;
            }
        }

        &__body {
            pointer-events: auto;
            display: inline-block;
            cursor: auto;
            background-color: var(--bg-secondary);
            overflow: auto;
            border-radius: 8px;
            box-shadow: 0 0 27px #0006;
            transform-origin: top right;
            max-width: 100%;

            &.is-left {
                transform-origin: top left;
            }

            @media (max-width: 550px) {
                width: 100%;
            }
        }
    }

    .nav-popover-animation {
        &-enter-from, &-leave-to {
            opacity: 0;
            transform: scale(0) translate3d(0, 0, 0);
            z-index: -1;
        }

        &-enter-to, &-leave-from {
            opacity: 1;
            transform: scale(1) translate3d(0, 0, 0);
            z-index: 111;
        }

        &-enter-active, &-leave-active {
            @include css_anim($time: .25s, $style: cubic-bezier(0.215, 0.61, 0.355, 1));
        }
    }
</style>
