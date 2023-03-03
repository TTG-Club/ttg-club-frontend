<script lang="ts">
    import {
        computed, defineComponent, h
    } from 'vue';
    import { useRender } from '@/components/render/composition/useRender';

    export default defineComponent({
        props: {
            entry: {
                type: [
                    String,
                    Array,
                    Object
                ],
                default: null
            }
        },
        setup(props) {
            const { recursiveRender } = useRender();

            const converted = computed(() => {
                if (!props.entry) {
                    return h('span', 'loading...');
                }

                return recursiveRender(props.entry);
            });

            return () => h(
                'div',
                { class: 'markup-render' },
                converted.value
            );
        }
    });
</script>
