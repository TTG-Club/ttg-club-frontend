<script>
    import {
        h, shallowRef
    } from "vue";
    import defineRawComponent from "@/common/utils/DefineRawComponent";

    export default {
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
        data: () => ({
            component: undefined,
            error: false,
            loading: true
        }),
        watch: {
            async template() {
                await this.initComponent();
            },

            async url() {
                await this.initComponent();
            }
        },
        async mounted() {
            await this.initComponent();
        },
        beforeUnmount() {
            this.$emit('before-unmount');
        },
        methods: {
            async initComponent() {
                try {
                    this.error = false;
                    this.loading = true;

                    const component = await defineRawComponent(this.template, this.url);

                    this.component = shallowRef(component);
                    this.loading = false;

                    this.$nextTick(() => {
                        this.$emit('loaded');
                    });
                } catch (err) {
                    this.error = true;
                    this.loading = false;
                }
            }
        },
        render() {
            let inner = '';

            if (this.component) {
                inner = h(this.component);
            }

            if (this.error || (!this.loading && !this.component)) {
                inner = 'Ошибка...';
            }

            if (this.loading && !this.error) {
                inner = 'Загрузка...';
            }

            return (
                h(this.tag, { class: 'raw-content' }, inner)
            );
        }
    };
</script>
