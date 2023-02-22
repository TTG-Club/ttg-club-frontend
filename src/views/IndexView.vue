<template>
    <div class="main_page_wrapper">
        <h1 style="height: 0; opacity: 0; overflow: hidden;">
            TTG.Club Oнлайн-справочник
        </h1>

        <div class="main_block">
            <div class="header">
                <p
                    class="search_row_g"
                    @click.left.exact.prevent="openSearchModal"
                >
                    Нажмите
                    <span class="computer_version">
                        &nbsp;тут или<span class="key">&#171; / &#187;</span>
                    </span>
                    для начала поиска
                </p>
            </div>

            <div class="card_row">
                <router-link
                    v-for="(section, key) in navItems"
                    :key="key"
                    :to="{ path: section.url }"
                    class="card"
                >
                    <div class="title">
                        <h4>{{ section.name }}</h4>
                    </div>
                </router-link>
            </div>

            <div class="column">
                <div class="left">
                    <div class="block">
                        <div class="block__bot">
                            <div class="dnd5club_tel_bot">
                                <div class="info">
                                    <h4>Telegram Spells Bot</h4>

                                    <p>Книга заклинаний, у вас в руках!</p>

                                    <div class="bottom">
                                        <a
                                            class="main"
                                            href="https://t.me/ttg_club_bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Подключить</a>

                                        <router-link
                                            :to="{ path: '/info/telegram_spells_bot' }"
                                            rel="noopener noreferrer"
                                        >
                                            Описание
                                        </router-link>
                                    </div>
                                </div>

                                <div class="bg_img" />
                            </div>

                            <div class="discord_bot">
                                <div class="info">
                                    <h4>Discord Bot <sup class="beta">β</sup></h4>

                                    <p>Весь сайт, у вас на сервере!</p>

                                    <div class="bottom">
                                        <!-- eslint-disable vue/max-len -->
                                        <a
                                            class="main"
                                            href="https://discord.com/api/oauth2/authorize?client_id=1074095730265964654&permissions=274878032896&scope=bot%20applications.commands"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Пригласить</a>
                                        <!-- eslint-enable vue/max-len -->

                                        <router-link
                                            :to="{ path: '/info/discord_bot' }"
                                            rel="noopener noreferrer"
                                        >
                                            Описание
                                        </router-link>
                                    </div>
                                </div>

                                <div class="bg_img" />
                            </div>
                        </div>

                        <div class="links_block">
                            <h3>Инструменты:</h3>

                            <div class="list">
                                <router-link
                                    v-for="(tool, key) in tools"
                                    :key="key"
                                    :to="{ path: tool.url }"
                                    class="block tip w-100"
                                >
                                    {{ tool.name }}
                                </router-link>
                            </div>
                        </div>
                    </div>

                    <div class="block__youtube">
                        <h3>D&D 5e новости:</h3>

                        <!-- Менять надо только последние символы после / EVGfn931MzQ -->
                        <iframe
                            title="D&D 5e новости"
                            width="100%"
                            src="https://www.youtube.com/embed/EVGfn931MzQ"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                        />

                        <a
                            href="https://www.youtube.com/@online.shirma"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn"
                        >Все видео</a>
                    </div>
                </div>

                <div
                    v-if="showedPartners.length"
                    class="right"
                >
                    <div class="links_block">
                        <h3>Наши друзья:</h3>

                        <div class="list">
                            <a
                                v-for="(partner, key) in showedPartners"
                                :key="key"
                                v-tippy="{
                                    content: partner.description,
                                }"
                                :href="partner.url"
                                class="block tip"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    width="20px"
                                    height="20px"
                                    :src="partner.img"
                                    :alt="partner.name"
                                >
                                {{ partner.name }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {
        computed, defineComponent
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import orderBy from 'lodash/orderBy';
    import { useNavStore } from '@/store/UI/NavStore';
    import type { TNavItem } from '@/store/UI/NavStore';

    export default defineComponent({
        setup() {
            const navStore = useNavStore();
            const { showedNavItems, showedPartners } = storeToRefs(navStore);

            const navItems = computed(() => {
                const items: TNavItem[] = [];

                const iterate = (childList: TNavItem[]) => {
                    for (const child of childList) {
                        if (child.children instanceof Array && child.children.length) {
                            iterate(child.children);
                        }

                        if (child.onIndex) {
                            items.push(child);
                        }
                    }
                };

                iterate(showedNavItems.value);

                return orderBy(
                    items,
                    ['indexOrder'],
                    ['asc']
                );
            });

            const tools = computed<TNavItem[]>(() => {
                const navTools = showedNavItems.value.find(item => item?.icon === 'menu-tools');

                if (!navTools?.children?.length) {
                    return [];
                }

                return orderBy(
                    navTools.children,
                    ['order'],
                    ['asc']
                );
            });

            const openSearchModal = () => {
                document.dispatchEvent(new Event('open-search'));
            };

            return {
                navItems,
                tools,
                showedPartners,
                openSearchModal
            };
        }
    });
</script>

<style lang="scss" scoped>

</style>
