<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="initPages"
    >
        <div
            v-for="(group, groupKey) in armors"
            :key="groupKey"
            class="armors-group"
        >
            <div class="armors-group__name">
                {{ group.name }}
            </div>

            <div class="armors-group__list">
                <armor-link
                    v-for="armor in group.list"
                    :key="armor.url"
                    :armor="armor"
                    :to="{ path: armor.url }"
                />
            </div>
        </div>
    </content-layout>
</template>

<script lang="ts">
    import {
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import sortBy from 'lodash/sortBy';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import ArmorLink from '@/views/Inventory/Armors/ArmorLink.vue';
    import { useUIStore } from '@/store/UI/UIStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { usePagination } from '@/common/composition/usePagination';
    import { ArmorsFilterDefaults } from '@/types/Inventory/Armors.types';

    export default defineComponent({
        components: {
            ArmorLink,
            ContentLayout
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            const uiStore = useUIStore();

            const {
                isMobile,
                fullscreen
            } = storeToRefs(uiStore);

            const filter = useFilter({
                dbName: ArmorsFilterDefaults.dbName,
                url: ArmorsFilterDefaults.url
            });

            const {
                initPages,
                items
            } = usePagination({
                url: '/armors',
                limit: -1,
                search: filter.search,
                order: [
                    {
                        field: 'AC',
                        direction: 'asc'
                    }
                ]
            });

            // TODO: Доделать типизацию
            const armors = computed(() => {
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

                if (armors.value.length === 1 && !isMobile.value) {
                    await router.push({ path: armors.value[0].list[0].url });
                }
            };

            onBeforeMount(async () => {
                await initPages();

                if (!isMobile.value && armors.value.length && route.name === 'armors') {
                    await router.push({ path: armors.value[0].list[0].url });
                }
            });

            return {
                isMobile,
                fullscreen,
                armors,
                filter,
                showRightSide: computed(() => route.name === 'armorDetail'),
                initPages,
                onSearch
            };
        }
    });
</script>
