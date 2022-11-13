<template>
    <div
        class="ui-switch"
        :class="{ 'is-full-width': useFullWidth }"
    >
        <ui-group-button
            :use-full-width="useFullWidth"
            :is-vertical="isMobile"
        >
            <ui-button
                v-for="(option, index) in options"
                :key="`${option[trackBy]}_${index}`"
                :class="{ 'is-active': selected?.[trackBy] === option[trackBy] }"
                @click.left.exact.prevent="selected = option"
            >
                {{ option[label] }}
            </ui-button>
        </ui-group-button>
    </div>
</template>

<script>
    import {
        computed, defineComponent, onBeforeMount
    } from "vue";
    import UiGroupButton from "@/components/form/UiGroupButton.vue";
    import UiButton from "@/components/form/UiButton.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default defineComponent({
        components: {
            UiButton,
            UiGroupButton
        },
        props: {
            options: {
                type: Array,
                required: true
            },
            modelValue: {
                type: [Object, null],
                required: true
            },
            trackBy: {
                type: String,
                default: 'id'
            },
            label: {
                type: String,
                default: 'name'
            },
            preSelectFirst: {
                type: Boolean,
                default: false
            },
            useFullWidth: {
                type: Boolean,
                default: false
            }
        },
        setup(props, { emit }) {
            const uiStore = useUIStore();

            const selected = computed({
                get: () => props.modelValue,
                set: value => emit('update:model-value', value)
            });

            onBeforeMount(() => {
                if (props.preSelectFirst && props.modelValue === null) {
                    emit('update:model-value', props.options[0]);
                }
            });

            return {
                selected,
                isMobile: computed(() => uiStore.isMobile)
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ui-switch {
        display: inline-flex;

        &.is-full-width {
            display: flex;
            width: 100%;
        }

        .ui-button {
            background-color: var(--bg-secondary);
            color: var(--text-b-color);

            &:active,
            &.is-active {
                @include css_anim();

                background-color: var(--primary-active);
                color: var(--text-btn-color);
            }

            @include media-min($xl) {
                &:hover {
                    @include css_anim();

                    background-color: var(--primary-hover);
                    color: var(--text-btn-color);
                }
            }

            &:disabled {
                background-color: var(--primary);
                color: var(--text-btn-color);
                cursor: not-allowed;
                opacity: .6;
            }
        }
    }
</style>
