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
            v-else
            class="left_info"
        >
            <slot name="left" />
        </span>

        <span v-if="source">
            Источник:

            <span
                v-if="source.homebrew"
                class="homebrew_text"
            >Homebrew</span>

            <span
                v-tippy="{ content: source.name }"
            >&nbsp;{{ source.shortName }}</span>
        </span>

        <span v-else-if="$slots.default">
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
        justify-content: space-between;
        border-radius: 8px;
        margin: 0 24px;
        background: var(--bg-sub-menu);

        .left_info {
            font-style: italic;
            margin-right: 8px;
        }

        &.bg_grey {
            background: var(--bg-sub-menu);
        }

        @media (max-width: 1200px) {
            flex-direction: column;
            margin: 0 16px;

            span {
                &:nth-child(n + 2) {
                    margin-top: 12px;
                }
            }
        }
    }
</style>
