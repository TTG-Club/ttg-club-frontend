<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
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
    </content-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import sortBy from "lodash/sortBy";
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from "@/components/content/ContentLayout.vue";
    import WeaponLink from "@/views/Inventory/Weapons/WeaponLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";
    import { useFilter } from '@/common/composition/useFilter';
    import { WeaponsFilterDefaults } from '@/types/Inventory/Weapons.types';
    import { usePagination } from '@/common/composition/usePagination';

    export default defineComponent({
        components: {
            WeaponLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();
            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: WeaponsFilterDefaults.dbName,
                url: WeaponsFilterDefaults.url
            });

            const { initPages, items } = usePagination({
                url: '/weapons',
                limit: -1,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search,
                order: [
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ]
            });

            // TODO: Доделать типизацию
            const weapons = computed(() => {
                const list: any = [];
                const types: any = [];

                if (!items.value) {
                    return list;
                }

                for (const armor of items.value) {
                    if (types.find((obj: any) => obj.name === armor.type.name)) {
                        continue;
                    }

                    types.push(armor.type);
                }

                for (const type of sortBy(types, [o => o.order])) {
                    list.push({
                        name: type.name,
                        list: items.value.filter(armor => armor.type.name === type.name)
                    });
                }

                return list;
            });

            const onSearch = async () => {
                await initPages();

                if (weapons.value.length === 1 && !isMobile.value) {
                    await router.push({ path: weapons.value[0].list[0].url });
                }
            };

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();

                if (!isMobile.value && weapons.value.length && route.name === 'weapons') {
                    await router.push({ path: weapons.value[0].list[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                weapons,
                filter,
                showRightSide: computed(() => route.name === 'weaponDetail'),
                initPages,
                onSearch
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
