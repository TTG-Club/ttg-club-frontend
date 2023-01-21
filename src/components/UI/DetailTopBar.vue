<template>
    <div
        :class="{ bg_grey: bgGrey }"
        class="row_info"
    >
        <span
            v-if="left"
            class="left_info"
        >
            {{ left }}
        </span>

        <span
            v-else-if="!!$slots.left"
            class="left_info"
        >
            <slot name="left" />
        </span>

        <span
            v-if="source"
            class="right_info"
        >
            Источник:

            <span
                v-if="source.homebrew"
                class="homebrew_text"
            >Homebrew</span>

            <span
                v-tippy="{ content: source.name }"
            >&nbsp;{{ source.shortName }}</span>
        </span>

        <span
            v-else-if="$slots.default"
            class="right_info"
        >
            <slot />
        </span>
    </div>
</template>

<script>
    export default {
        name: 'DetailTopBar',
        props: {
            left: {
                type: String,
                default: ''
            },
            source: {
                type: Object,
                default: undefined
            },
            bgGrey: {
                type: Boolean,
                default: true
            }
        }
    };
</script>

<style lang="scss" scoped>
    .row_info {
        display: flex;
        padding: 12px;
        flex-direction: column;
        justify-content: space-between;
        border-radius: 8px;
        margin: 0 16px;
        gap: 12px;
        background: var(--bg-sub-menu);

        @include media-min($xl) {
            flex-direction: row;
            margin: 0 24px;
        }

        .left_info {
            font-style: italic;
            margin-right: 8px;
            flex: 1 1 100%;

            @include media-min($xl) {
                margin-right: 0;
            }
        }

        .right_info {
            flex-shrink: 0;
        }

        &.bg_grey {
            background: var(--bg-sub-menu);
        }
    }
</style>
