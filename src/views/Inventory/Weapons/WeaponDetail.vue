<template>
    <content-detail>
        <template #fixed>
            <section-header
                :close-on-desktop="fullscreen"
                :fullscreen="!isMobile"
                :subtitle="weapon?.name?.eng"
                :title="weapon?.name?.rus"
                bookmark
                print
                copy
                @close="close"
            />
        </template>

        <template #default>
            <weapon-body
                v-if="weapon"
                :weapon="weapon"
            />
        </template>
    </content-detail>
</template>

<script>
    import { mapState } from "pinia";
    import SectionHeader from "@/components/UI/SectionHeader.vue";
    import WeaponBody from "@/views/Inventory/Weapons/WeaponBody.vue";
    import { useWeaponsStore } from "@/store/Inventory/WeaponsStore";
    import ContentDetail from "@/components/content/ContentDetail.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: "WeaponDetail",
        components: {
            ContentDetail,
            WeaponBody,
            SectionHeader
        },
        async beforeRouteUpdate(to, from, next) {
            await this.loadNewWeapon(to.path);

            next();
        },
        data: () => ({
            weaponsStore: useWeaponsStore(),
            weapon: undefined,
            loading: true,
            error: false
        }),
        computed: {
            ...mapState(useUIStore, ['fullscreen', 'isMobile'])
        },
        async mounted() {
            await this.loadNewWeapon(this.$route.path);
        },
        methods: {
            close() {
                this.$router.push({ name: 'weapons' });
            },

            async loadNewWeapon(url) {
                try {
                    this.error = false;
                    this.loading = true;

                    this.weapon = await this.weaponsStore.weaponInfoQuery(url);

                    this.loading = false;
                } catch (err) {
                    this.error = true;
                }
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
