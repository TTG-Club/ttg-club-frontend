<template>
    <component
        :is="layout"
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="weaponsQuery"
        @update="weaponsQuery"
    >
        <div
            v-for="(group, groupKey) in weapons"
            :key="groupKey"
            class="weapons-group"
        >
            <div class="weapons-group__name">
                {{ group.name }}
            </div>

            <div class="weapons-group__list">
                <weapon-link
                    v-for="weapon in group.list"
                    :key="weapon.url"
                    :to="{ path: weapon.url }"
                    :weapon="weapon"
                />
            </div>
        </div>
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import sortBy from "lodash/sortBy";
    import { mapState } from "pinia";
    import TabLayout from "@/components/content/TabLayout";
    import ContentLayout from "@/components/content/ContentLayout";
    import { useWeaponsStore } from "@/store/Inventory/WeaponsStore";
    import WeaponLink from "@/views/Inventory/Weapons/WeaponLink";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: "WeaponsView",
        components: { WeaponLink },
        props: {
            inTab: {
                type: Boolean,
                default: false
            },
            storeKey: {
                type: String,
                default: ''
            },
            customFilter: {
                type: Object,
                default: undefined
            }
        },
        data: () => ({
            weaponsStore: useWeaponsStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            filter() {
                return this.weaponsStore.getFilter || undefined;
            },

            weapons() {
                const weapons = [];
                const types = [];

                if (!this.weaponsStore.getWeapons) {
                    return weapons;
                }

                for (const weapon of this.weaponsStore.getWeapons) {
                    if (types.find(obj => obj.name === weapon.type.name)) {
                        continue;
                    }

                    types.push(weapon.type);
                }

                for (const type of sortBy(types, [o => o.order])) {
                    weapons.push({
                        name: type.name,
                        list: this.weaponsStore.getWeapons.filter(weapon => weapon.type.name === type.name)
                    });
                }

                return weapons;
            },

            showRightSide() {
                return this.$route.name === 'weaponDetail';
            },

            layout() {
                return this.inTab
                    ? this.layoutComponents.tab
                    : this.layoutComponents.content;
            }
        },
        watch: {
            storeKey: {
                async handler() {
                    await this.init();
                }
            },
            customFilter: {
                deep: true,
                async handler() {
                    await this.init();
                }
            }
        },
        async mounted() {
            await this.init();

            if (!this.isMobile && this.weapons[0]?.list?.length && this.$route.name === 'weapons') {
                await this.$router.push({ path: this.weapons[0].list[0].url });
            }
        },
        beforeUnmount() {
            this.weaponsStore.clearStore();
        },
        methods: {
            async init() {
                await this.weaponsStore.initFilter(this.storeKey, this.customFilter);
                await this.weaponsStore.initWeapons();
            },

            async weaponsQuery() {
                await this.weaponsStore.initWeapons();
            },

            async nextPage() {
                await this.weaponsStore.nextPage();
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>
