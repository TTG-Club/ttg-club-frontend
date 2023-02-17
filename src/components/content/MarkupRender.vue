<script lang="ts" setup>
    import { computed, h } from 'vue';
    import { useMarkup } from '@/common/composition/useMarkup';

    const props = withDefaults(
        defineProps<{
            entry: string | null;
        }>(),
        {
            entry: null
        }
    );

    const { parse } = useMarkup();

    const converted = computed(() => {
        if (!props.entry) {
            return h('span', 'loading...');
        }

        return parse(props.entry);
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
