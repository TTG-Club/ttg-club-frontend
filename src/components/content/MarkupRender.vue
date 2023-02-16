<script lang="ts" setup>
    import { computed, h } from 'vue';
    import { useMarkup } from '@/common/composition/useMarkup';

    const props = withDefaults(
        defineProps<{
            entries?: any[] | null;
            entry?: any | null;
        }>(),
        {
            entries: null,
            entry: null
        }
    );

    const { getConverted } = useMarkup();

    const converted = computed(() => {
        if (!props.entry && !props.entries) {
            return h('span', 'loading...');
        }

        if (props.entries instanceof Array) {
            return getConverted(props);
        }

        return getConverted(props.entry);
    });

    const markup = h(
        'div',
        { class: 'markup-render' },
        converted.value
    );
</script>

<template>
    <markup />
</template>
