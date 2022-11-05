import { defineStore } from 'pinia';

// eslint-disable-next-line import/prefer-default-export
export const useNavStore = defineStore('NavStore', {
    state: () => ({
        items: [],
        meta: undefined
    }),

    getters: {
        getNavItems: state => state.items,
        getMeta: state => state.meta
    },

    actions: {
        setNavItems() {
            this.items = [
                {
                    label: 'Персонаж',
                    icon: 'menu-character',
                    links: [
                        {
                            label: 'Классы',
                            url: '/classes'
                        },
                        {
                            label: 'Расы',
                            url: '/races'
                        },
                        {
                            label: 'Черты',
                            url: '/traits'
                        },
                        {
                            label: 'Особенности классов',
                            url: '/options'
                        },
                        {
                            label: 'Предыстории',
                            url: '/backgrounds'
                        },
                        {
                            label: 'Заклинания',
                            url: '/spells'
                        }
                    ]
                },
                {
                    label: 'Предметы',
                    icon: 'menu-inventory',
                    links: [
                        {
                            label: 'Оружие',
                            url: '/weapons'
                        },
                        {
                            label: 'Доспехи',
                            url: '/armors'
                        },
                        {
                            label: 'Снаряжение',
                            url: '/items'
                        },
                        {
                            label: 'Драгоценности',
                            url: '/treasures'
                        },
                        {
                            label: 'Магические предметы',
                            url: '/items/magic'
                        }
                    ]
                },
                {
                    label: 'Мастерская',
                    icon: 'menu-workshop',
                    links: [
                        {
                            label: 'Бестиарий',
                            url: '/bestiary'
                        },
                        {
                            label: 'Ширма (Справочник)',
                            url: '/screens'
                        }
                    ]
                },
                {
                    label: 'Инструменты',
                    icon: 'menu-tools',
                    links: [
                        {
                            label: 'Торговец',
                            url: '/tools/trader'
                        },
                        {
                            label: 'Случайные столкновения',
                            url: '/tools/encounters'
                        },
                        {
                            label: 'Сокровищница',
                            url: '/tools/treasury'
                        },
                        {
                            label: 'Дикая магия',
                            url: '/tools/wildmagic'
                        },
                        {
                            label: 'Безумие',
                            url: '/tools/madness'
                        }

                        // {
                        //     label: 'Калькулятор характеристик',
                        //     url: '/tools/ability-calc'
                        // }
                    ]
                },
                {
                    label: 'База знаний',
                    icon: 'menu-wiki',
                    links: [
                        {
                            label: 'Боги',
                            url: '/gods'
                        },
                        {
                            label: 'Правила и термины',
                            url: '/rules'
                        },
                        {
                            label: 'Источники',
                            url: '/books'
                        }
                    ]
                },
                {
                    label: 'Инструкции',
                    icon: 'menu-question',
                    links: [
                        {
                            label: 'Как использовать бота',
                            url: '/telegram_bot'
                        },
                        {
                            label: 'Импорт существ в FvTT',
                            url: '/fvtt_import'
                        },
                        {
                            label: 'Управление закладками',
                            url: '/bookmarks_info'
                        }
                    ]
                },
                {
                    label: 'Информация',
                    icon: 'menu-information',
                    links: [
                        {
                            label: 'Мы в Discord',
                            url: 'https://discord.gg/zqBnMJVf3z',
                            external: true
                        },
                        {
                            label: 'Мы в ВКонтакте',
                            url: 'https://vk.com/ttg.club',
                            external: true
                        },
                        {
                            label: 'Мы на Boosty',
                            url: 'https://boosty.to/dnd5club',
                            external: true
                        },
                        {
                            label: 'Мы на Youtube',
                            url: 'https://www.youtube.com/channel/UCpFse6-P2IBXYfkesAxZbfA',
                            external: true
                        },
                        {
                            label: 'Наш бот для Telegram',
                            url: 'https://t.me/ttg_club_bot',
                            external: true
                        },
                        {
                            label: 'Мастер на Boosty',
                            url: 'https://boosty.to/dnd5eclub',
                            external: true
                        }
                    ]
                }
            ];
        },

        async getMetaByURL(url) {
            try {
                const resp = await this.$http.get(`/meta${ url }`);

                if (resp.status === 200) {
                    this.meta = resp.data;

                    return Promise.resolve(resp.data);
                }

                return Promise.reject(resp.statusText);
            } catch (err) {
                return Promise.resolve(err);
            }
        },

        getMetaTag(name) {
            if (!document.querySelector(`meta[name="${ name }"]`)) {
                const meta = document.createElement('meta');

                meta.name = name;

                document.getElementsByTagName('head')[0].appendChild(meta);
            }

            return document.querySelector(`meta[name="${ name }"]`);
        },

        setMeta(meta) {
            if (meta?.title) {
                document.title = meta.title;
            }

            if (meta?.description) {
                const description = this.getMetaTag('description');

                description.setAttribute('content', meta.description);
            }
        },

        async updateMetaByURL(url) {
            try {
                const meta = await this.getMetaByURL(url);

                this.setMeta(meta);

                return Promise.resolve();
            } catch (err) {
                return Promise.resolve();
            }
        }
    }
});
