<template>
    <div
        class="list-row"
        :style="style"
    >
        <div
            v-for="(item, index) in items"
            :key="item + index"
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
    }

    const props = withDefaults(defineProps<TListRowProps>(), {
        columns: 1
    });

    const items = isArray(props.row) ? props.row : [props.row];

    const style = {
        '--list-row-columns': props.columns + 1
    };
</script>

<style lang="scss" scoped>
    $column-spacing: 12px;
    $min-column-width: 300px;

    .list-row {
        display: grid;
        /*
            Количество колонок динамическое,
            каждый элемент не может занимать
            меньше указанной в переменной ширины
            и сворачивается при уменьшении
        */
        grid-template-columns: repeat(
                auto-fit,
                minmax(min(100%, max(#{$min-column-width}, 100% / var(--list-row-columns))), 1fr)
        );
        gap: $column-spacing;
    }
</style>
