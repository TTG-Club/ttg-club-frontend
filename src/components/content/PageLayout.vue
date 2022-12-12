<template>
    <div class="page-layout">
        <div
            v-if="$slots.left && !isMobile"
            class="page-layout__side--left"
        >
            <slot name="left"/>
        </div>

        <div class="page-layout__side--center">
            <div
                v-if="$slots.title || $slots.subtitle"
                class="page-layout__header"
            >
                <h1
                    v-if="$slots.title"
                    class="page-layout__title"
                >
                    <slot name="title"/>
                </h1>

                <h3
                    v-if="$slots.subtitle"
                    class="page-layout__subtitle"
                >
                    <slot name="subtitle"/>
                </h3>

                <time
                    v-if="dateTimeFormatted"
                    :datetime="dateTime"
                >{{ dateTimeFormatted }}</time>
            </div>

            <slot/>

            <div class="page-layout__socials">
                <social-links v-if="useSocialLinks"/>
            </div>
        </div>

        <div
            v-if="$slots.right && !isMobile"
            class="page-layout__side--right"
        >
            <slot name="right"/>
        </div>
    </div>
</template>

<script>
    import { computed, defineComponent } from "vue";
    import SocialLinks from "@/components/content/SocialLinks.vue";
    import { useDayjs } from "@/common/composition/useDayjs";
    import { useUIStore } from "@/store/UI/UIStore";

    export default defineComponent({
        components: { SocialLinks },
        props: {
            useSocialLinks: {
                type: Boolean,
                default: true
            },
            dateTime: {
                type: String,
                default: ''
            }
        },
        setup(props) {
            const uiStore = useUIStore();
            const dayjs = useDayjs();

            const dateTimeFormatted = computed(() => {
                const datetime = dayjs(props.dateTime);

                if (!datetime.isValid()) {
                    return '';
                }

                return datetime.format('LL');
            });

            return {
                dateTimeFormatted,
                isMobile: computed(() => uiStore.isMobile)
            };
        }
    });
</script>

<style lang="scss" scoped>
    .page-layout {
        height: 100%;
        display: flex;

        &__side {
            &--left {
                flex: 1 0 10%;
            }

            &--center {
                flex: 1 1 620px;
                max-width: 620px;
                margin:0 auto;
                border-radius: 12px;

                @include media-min($lg) {
                    flex: 1 1 960px;
                    max-width: 960px;
                }
            }

            &--right {
                flex: 1 0 10%;
            }
        }

        &__header {
            padding: 8px 0 16px 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 16px;
        }

        &__title {
            margin-bottom: 16px;
            font-weight: 500;
            font-family: "Lora";
        }

        &__subtitle {
            margin-top: 0;
            line-height: normal;
        }

        &__socials {
            margin: 40px 0;
        }
    }
</style>
