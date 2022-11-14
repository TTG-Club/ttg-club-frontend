<template>
    <component
        :is="layout"
        :filter-instance="spellsStore.filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="spellsQuery"
        @list-end="nextPage"
    >
        <spell-link
            v-for="spell in spellsStore.spells"
            :key="spell.url"
            :in-tab="inTab"
            :spell="spell"
            :to="{ path: spell.url }"
        />
    </component>
</template>

<script>
    import { shallowRef } from "vue";
    import { mapState } from "pinia";
    import { useSpellsStore } from '@/store/Spells/SpellsStore';
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import TabLayout from "@/components/content/TabLayout.vue";
    import SpellLink from "@/views/Spells/SpellLink.vue";
    import { useUIStore } from "@/store/UI/UIStore";

    export default {
        name: 'SpellsView',
        components: {
            SpellLink,
            TabLayout,
            ContentLayout
        },
        props: {
            inTab: {
                type: Boolean,
                default: false
            },
            storeKey: {
                type: String,
                default: ''
            },
            filterUrl: {
                type: [String, undefined],
                default: undefined
            },
            books: {
                type: [Array, undefined],
                default: undefined
            }
        },
        data: () => ({
            spellsStore: useSpellsStore(),
            layoutComponents: {
                tab: shallowRef(TabLayout),
                content: shallowRef(ContentLayout)
            }
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile']),

            showRightSide() {
                return this.$route.name === 'spellDetail';
            },

            layout() {
                return this.inTab
                    ? this.layoutComponents.tab
                    : this.layoutComponents.content;
            },

            useAutoOpenFirst() {
                return !this.isMobile
                    && !!this.spellsStore.spells.length
                    && this.$route.name === 'spells'
                    && !this.inTab;
            }
        },
        watch: {
            storeKey: {
                async handler() {
                    await this.init();
                }
            },
            filterUrl: {
                async handler() {
                    await this.init();
                }
            },
            books: {
                deep: true,
                async handler() {
                    await this.init();
                }
            }
        },
        async mounted() {
            await this.init();

            if (this.useAutoOpenFirst) {
                await this.$router.push({ path: this.spellsStore.spells[0].url });
            }
        },
        beforeUnmount() {
            this.spellsStore.clearStore();
        },
        methods: {
            async init() {
                await this.spellsStore.initFilter(this.storeKey, this.filterUrl);
                await this.spellsStore.initSpells(this.books);
            },

            async spellsQuery() {
                await this.spellsStore.initSpells(this.books);
            },

            async nextPage() {
                await this.spellsStore.nextPage(this.books);
            },

            async onSearch() {
                await this.spellsStore.initSpells(this.books);

                if (this.spellsStore.spells.length === 1 && this.useAutoOpenFirst) {
                    await this.$router.push({ path: this.spellsStore.spells[0].url });
                }
            }
        }
    };
</script>
