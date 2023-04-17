<template>
    <default-bookmark-button v-bind="$props" />

    <custom-bookmark-button
        v-if="isAuthenticated"
        v-bind="$props"
    />
</template>

<script>
    import { defineComponent } from 'vue';
    import { storeToRefs } from 'pinia';
    import DefaultBookmarkButton from '@/features/bookmarks/components/buttons/DefaultBookmarkButton.vue';
    import CustomBookmarkButton from '@/features/bookmarks/components/buttons/CustomBookmarkButton.vue';
    import { useUserStore } from '@/store/UI/UserStore';

    export default defineComponent({
        components: {
            CustomBookmarkButton,
            DefaultBookmarkButton
        },
        props: {
            name: {
                type: String,
                default: ''
            },
            url: {
                type: String,
                default: ''
            }
        },
        setup() {
            const { isAuthenticated } = storeToRefs(useUserStore());

            return {
                isAuthenticated
            };
        }
    });
</script>
