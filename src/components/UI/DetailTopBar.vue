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
        padding: 12px 24px 12px 24px;
        justify-content: space-between;

        .left_info {
            font-style: italic;
            margin-right: 8px;
        }

        &.bg_grey {
            background: var(--bg-sub-menu);
            border-bottom: 1px solid var(--border);
        }

        @media (max-width: 1200px) {
            padding: 12px 16px 12px 16px;
            flex-direction: column;

            span {
                &:nth-child(n + 2) {
                    margin-top: 12px;
                }
            }
        }
    }
</style>
