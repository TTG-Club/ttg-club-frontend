<script lang="ts">
    import { defineComponent } from 'vue';
    import { VuePaginate } from '@svifty7/vue-paginate';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default defineComponent({
        components: {
            VuePaginate,
            SvgIcon
        },
        props: {
            ...VuePaginate.props
        },
        setup(props) {
            return {
                props
            };
        }
    });
</script>

<template>
    <vue-paginate
        v-bind="props"
        :no-li-surround="true"
        container-class="ui-paginate"
        active-class="is-active"
        disabled-class="is-disabled"
        page-link-class="ui-paginate__page"
        prev-link-class="ui-paginate__prev"
        next-link-class="ui-paginate__next"
        @update:model-value="$emit('update:model-value', $event)"
    >
        <template #prevBtnText>
            <svg-icon icon-name="arrow-stroke" />
        </template>

        <template #nextBtnText>
            <svg-icon icon-name="arrow-stroke" />
        </template>
    </vue-paginate>
</template>

<style lang="scss">
    .ui-paginate {
        display: inline-flex;
        gap: 8px;
        user-select: none;

        &__prev,
        &__next,
        &__page {
            @include css_anim();

            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            font-weight: 700;
            font-size: 12px;
            line-height: 16px;
            text-align: center;
            letter-spacing: 0.44px;
            color: var(--text-color);
            border: {
                width: 1px;
                style: solid;
                color: var(--border);
                radius: 4px;
            };
        }

        &__page {
            &.is-active {
                @include css_anim();

                border-color: var(--primary);
                background: var(--primary);
                color: var(--text-btn-color);
            }

            &:hover {
                &:not(.is-active):not(.is-disabled) {
                    border-color: var(--primary-hover);
                    background: var(--primary-hover);
                    color: var(--text-btn-color);
                }
            }
        }

        &__prev,
        &__next {
            color: var(--primary);
            border-color: var(--primary);

            svg {
                width: 21px;
                height: 21px;
            }

            &.is-disabled {
                @include css_anim();

                background: var(--hover);
                border-color: var(--hover);
                color: var(--text-color);
                opacity: .4;
            }
        }

        &__prev {
            svg {
                transform: rotate(90deg);
            }
        }

        &__next {
            svg {
                transform: rotate(-90deg);
            }
        }
    }
</style>
