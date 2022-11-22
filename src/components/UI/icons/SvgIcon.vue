<template>
    <svg
        :class="classList"
        aria-hidden="true"
        class="svg-icon"
        role="img"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
    >
        <use :xlink:href="svg"/>
    </svg>
</template>

<script>
    import '@/common/utils/SvgRequire';

    export default {
        props: {
            iconName: {
                type: [String, Function],
                required: true
            },
            strokeEnable: {
                type: Boolean,
                default: true
            },
            fillEnable: {
                type: Boolean,
                default: false
            }
        },
        computed: {
            svg() {
                return `#dnd5club-icon-${ this.iconName }`;
            },

            classList() {
                return {
                    'svg-color--stroke': !this.fillEnable,
                    'svg-color--fill': this.fillEnable && !this.strokeEnable,
                    'svg-color': this.fillEnable && this.strokeEnable
                };
            }
        }
    };
</script>

<style lang="scss">
    .svg-icon {
        overflow: hidden;
        flex-shrink: 0;
        display: block;
        width: 100%;
        height: 100%;

        &.svg-color {
            stroke: currentColor;
            fill: currentColor;

            &--stroke {
                stroke: currentColor;
                fill: none;
            }

            &--fill {
                fill: currentColor;
                stroke: none;
            }
        }
    }
</style>
