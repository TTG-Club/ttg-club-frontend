<template>
    <router-link
        v-slot="{ href }"
        :to="{ path: screen.url }"
        custom
        v-bind="$props"
    >
        <a
            v-bind="$attrs"
            :href="href"
            class="screen-link"
            @click.left.exact.prevent="clickHandler(screen.url)"
        >
            <div class="screen-link__icon">
                <raw-content :template="screen.icon"/>
            </div>

            <div class="screen-link__body">
                <div class="screen-link__name">
                    {{ screen.name.rus }}
                </div>

                <div class="screen-link__desc">
                    <span v-tippy="{ content: screen.source.name }">{{
                        screen.source.shortName
                    }}</span> / <span>{{ screen.name.eng }}</span>
                </div>
            </div>
        </a>
    </router-link>

    <base-modal
        v-if="modal.data"
        v-model="modal.show"
        :bookmark="bookmarkObj"
    >
        <template #title>
            {{ screen.name.rus }}
        </template>

        <template #default>
            <screen-body :screen="modal.data"/>
        </template>
    </base-modal>
</template>

<script>
    import { RouterLink } from "vue-router";
    import { mapActions } from "pinia";
    import RawContent from "@/components/content/RawContent.vue";
    import BaseModal from "@/components/UI/modals/BaseModal.vue";
    import ScreenBody from "@/views/Screens/ScreenBody.vue";
    import { useScreensStore } from "@/store/Screens/ScreensStore";

    export default {
        name: "ScreenLink",
        components: {
            ScreenBody,
            BaseModal,
            RawContent
        },
        inheritAttrs: false,
        props: {
            screen: {
                type: Object,
                default: () => ({}),
                required: true
            },
            ...RouterLink.props
        },
        data: () => ({
            modal: {
                data: undefined,
                show: false
            }
        }),
        computed: {
            bookmarkObj() {
                return {
                    url: this.screen.url,
                    name: this.screen.name.rus
                };
            }
        },
        methods: {
            ...mapActions(useScreensStore, ['screenInfoQuery']),

            async clickHandler(url) {
                try {
                    if (!this.modal.data) {
                        this.modal.data = await this.screenInfoQuery(url);
                    }

                    this.modal.show = true;
                } catch (err) {
                    console.error(err);
                }
            }
        }
    };
</script>

<style lang="scss" scoped>
    .screen-link {
        @include css_anim();

        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        height: 100%;
        background-color: var(--bg-secondary);
        padding: 16px;
        border-bottom: 1px solid var(--border);
        border-right: 1px solid var(--border);
        border-left: 1px solid var(--border);

        &:hover {
            background-color: var(--hover);
        }

        &__icon {
            width: 40px;
            height: 40px;
            flex-shrink: 0;

            ::v-deep(svg) {
                width: 100% !important;
                height: 100% !important;

                path {
                    fill: var(--primary);
                }
            }
        }

        &__body {
            margin-left: 12px;
        }

        &__name {
            font-weight: 600;
            font-size: var(--h5-font-size);
            color: var(--text-color-title);
        }

        &__desc {
            font-weight: 400;
            // margin-top: 12px;
            font-size: var(--main-font-size);
            line-height: var(--main-line-height);
            color: var(--text-color);
        }
    }
</style>
