<template>
    <div
        class="ui-group-button"
        :class="{
            'is-vertical': isVertical,
            'is-reverse': isReverse,
            'is-full-width': useFullWidth,
        }"
    >
        <slot/>
    </div>
</template>

<script>
    import { defineComponent } from "vue";

    export default defineComponent({
        props: {
            isVertical: {
                type: Boolean,
                default: false
            },
            isReverse: {
                type: Boolean,
                default: false
            },
            useFullWidth: {
                type: Boolean,
                default: false
            }
        }
    });
</script>

<style lang="scss" scoped>
    .ui-group-button {
        display: inline-flex;
        flex-direction: row;

        &.is-full-width {
            display: flex;
            width: 100%;

            :slotted(.ui-button) {
                display: flex;
                flex: 1 1 auto;
            }
        }

        :slotted(.ui-button) {
            margin: 0;

            &:not(:last-child):not(:first-child) {
                border-radius: 0;
            }
        }

        &:not(.is-vertical):not(.is-reverse) {
            :slotted(.ui-button) {
                &:first-child {
                    border: {
                        top-right-radius: 0;
                        bottom-right-radius: 0;
                    };
                }

                &:last-child {
                    border: {
                        top-left-radius: 0;
                        bottom-left-radius: 0;
                    }
                }
            }
        }

        &.is-reverse {
            flex-direction: row-reverse;

            &:not(.is-vertical) {
                :slotted(.ui-button) {
                    &:first-child {
                        border: {
                            top-left-radius: 0;
                            bottom-left-radius: 0;
                        }
                    }

                    &:last-child {
                        border: {
                            top-right-radius: 0;
                            bottom-right-radius: 0;
                        };
                    }
                }
            }
        }

        &.is-vertical {
            flex-direction: column;

            &:not(.is-reverse) {
                :slotted(.ui-button) {
                    &:first-child {
                        border: {
                            bottom-right-radius: 0;
                            bottom-left-radius: 0;
                        };
                    }

                    &:last-child {
                        border: {
                            top-right-radius: 0;
                            top-left-radius: 0;
                        }
                    }
                }
            }

            &.is-reverse {
                flex-direction: column-reverse;

                :slotted(.ui-button) {
                    &:first-child {
                        border: {
                            top-right-radius: 0;
                            top-left-radius: 0;
                        };
                    }

                    &:last-child {
                        border: {
                            bottom-right-radius: 0;
                            bottom-left-radius: 0;
                        }
                    }
                }
            }
        }

    }
</style>
