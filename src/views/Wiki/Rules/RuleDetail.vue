<template>
    <content-detail class="rule-detail">
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :copy="!error && !loading"
                :fullscreen="!isMobile"
                :subtitle="rule?.name?.eng || ''"
                :title="rule?.name?.rus || ''"
                bookmark
                @close="close"
            />
        </template>

        <template #default>
            <rule-body
                v-if="rule"
                :rule="rule"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from '@/components/UI/SectionHeader.vue';
    import errorHandler from "@/common/helpers/errorHandler";
    import { useRulesStore } from "@/store/Wiki/RulesStore";
    import RuleBody from "@/views/Wiki/Rules/RuleBody.vue";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {

        components: {
            ContentDetail,
            RuleBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.loadNewRule(to.path);

            next();
        },
        data: () => ({
            ruleStore: useRulesStore(),
            rule: undefined,
            loading: false,
            error: false
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.loadNewRule(this.$route.path);
        },
        methods: {
            async loadNewRule(url) {
                try {
                    this.error = false;
                    this.loading = true;

                    this.rule = await this.ruleStore.ruleInfoQuery(url);

                    this.loading = false;
                } catch (err) {
                    this.loading = false;
                    this.error = true;

                    errorHandler(err);
                }
            },

            close() {
                this.$router.push({ name: 'rules' });
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
