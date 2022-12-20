<template>
    <component :is="tag">
        <component :is="component"/>
    </component>
</template>

<script lang="ts">
    import {
        computed,
        defineComponent,
        nextTick, onBeforeUnmount, ref, watch
    } from 'vue';
    import { useAxios } from '@/common/composition/useAxios';

    // eslint-disable-next-line vue/one-component-per-file
    export default defineComponent({
        name: "RawContent",
        props: {
            template: {
                type: String,
                default: undefined
            },
            url: {
                type: String,
                default: undefined
            },
            tag: {
                type: String,
                default: 'div'
            }
        },
        setup(props, { emit }) {
            const http = useAxios();
            const templateString = ref<string | null>(null);
            const error = ref(false);
            const loading = ref(true);

            const initComponent = async () => {
                if (!props.template && !props.url) {
                    throw new Error('URL and template is not defined');
                }

                try {
                    error.value = false;
                    loading.value = true;

                    templateString.value = props.template || '';

                    if (!templateString.value && !props.template) {
                        const { data } = await http.rawGet({
                            url: props.url
                        });

                        templateString.value = data;
                    }

                    loading.value = false;

                    nextTick(() => {
                        emit('loaded');
                    });

                    return Promise.resolve();
                } catch (err) {
                    error.value = true;
                    loading.value = false;

                    return Promise.reject(err);
                }
            };

            const component = computed(() => {
                let inner = '';

                if (templateString.value) {
                    inner = templateString.value;
                }

                if (error.value || (!loading.value && !templateString.value)) {
                    inner = 'Ошибка...';
                }

                if (loading.value && !error.value) {
                    inner = 'Загрузка...';
                }

                // eslint-disable-next-line vue/one-component-per-file
                return defineComponent({ template: inner });
            });

            watch(
                [() => props.template, () => props.url],
                async () => {
                    await initComponent();
                },
                {
                    immediate: true
                }
            );

            onBeforeUnmount(() => {
                emit('before-unmount');
            });

            return {
                component
            };
        }
    });
</script>
