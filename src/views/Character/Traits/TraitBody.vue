<template>
    <div class="trait-body">
        <detail-top-bar
            :left="`Требования: ${trait?.requirements || 'Нет'}`"
            :source="trait?.source"
        />

        <div class="trait-body__desc content-padding">
            <raw-content :template="trait?.description" />
        </div>
    </div>
</template>

<script>
    import RawContent from '@/components/content/RawContent.vue';
    import DetailTopBar from '@/components/UI/DetailTopBar.vue';

    export default {
        name: 'TraitBody',
        components: {
            DetailTopBar,
            RawContent
        },
        props: {
            trait: {
                type: Object,
                default: undefined,
                required: true
            }
        }
    };
</script>

<style lang="scss" scoped>
    ::v-deep(.row_info) {
        span {

            &:last-child {
                min-width: 220px;
                text-align: right;
            }
        }
    }
</style>
