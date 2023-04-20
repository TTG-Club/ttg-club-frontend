<template>
    <div
        class="list-row"
        :style="style"
    >
        <div
            v-for="item in items"
            :key="item[itemKey]"
            class="list-row__column"
        >
            <slot v-bind="{ item }" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import isArray from "lodash/isArray";
    import type { AnyArray } from "@/types/Shared/Utility.types";

    export type TListRowProps = {
        row: unknown | AnyArray;
        columns?: number;
        itemKey: string;
    }

    const props = withDefaults(defineProps<TListRowProps>(), {
        columns: 1
    });

    const items = isArray(props.row) ? props.row : [props.row];

    const style = {
        '--list-row-columns': props.columns
    };
</script>

<style lang="scss" scoped>
    $column-spacing: 12px;

    .list-row {
        display: flex;
        flex-wrap: wrap;
        margin: -$column-spacing * .5;

        &__column {
            flex-basis: calc(100% / var(--list-row-columns));
            padding: $column-spacing * .5;
            min-width: 0;
        }
    }
</style>
