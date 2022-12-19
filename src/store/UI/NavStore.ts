import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/common/composition/useAxios';
import isDev from '@/common/helpers/isDev';

export type TNavItem = {
    label: string
    url: string
    inDev?: boolean
    external?: boolean
}

export type TNavGroup = {
    label: string
    icon?: string
    inDev?: boolean
    links: Array<TNavItem>
}

export const useNavStore = defineStore('NavStore', () => {
    const http = useAxios();

    const navItems = ref<Array<TNavGroup>>([
        {
            label: 'Персонаж',
            icon: 'menu-character',
            links: [
                {
                    label: 'Классы',
                    url: '/classes'
                },
                {
                    label: 'Расы и происхождения',
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
                    label: 'Калькулятор характеристик',
                    url: '/tools/ability-calc'
                },
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
            ]
        },
        {
            label: 'База знаний',
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
    ]);

    const metaInfo = ref(undefined);

    const showedNavItems = computed(() => navItems.value
        .filter(group => {
            if (isDev) {
                return true;
            }

            return !group.inDev;
        })
        .map(group => ({
            ...group,
            links: group.links.filter(link => {
                if (isDev) {
                    return true;
                }

                return !link.inDev;
            })
        })));

    const getMetaByURL = async (url: string) => {
        try {
            const resp = await http.get({
                url: `/meta${ url }`
            });

            if (resp.status === 200) {
                metaInfo.value = resp.data;

                return Promise.resolve(resp.data);
            }

            return Promise.reject(resp.statusText);
        } catch (err) {
            return Promise.resolve(err);
        }
    };

    const getMetaTag = (name: string): HTMLMetaElement => {
        let el: HTMLMetaElement | null = document.querySelector(`meta[name="${ name }"]`);

        if (!el) {
            const meta = document.createElement('meta');

            meta.name = name;

            el = document.getElementsByTagName('head')[0].appendChild(meta);
        }

        return el;
    };

    // TODO: Доделать типизацию
    const setMeta = (meta: any) => {
        if (meta?.title) {
            document.title = meta.title;
        }

        if (meta?.description) {
            const description = getMetaTag('description');

            description.setAttribute('content', meta.description);
        }
    };

    const updateMetaByURL = async (url: string) => {
        try {
            const meta = await getMetaByURL(url);

            setMeta(meta);

            return Promise.resolve();
        } catch (err) {
            return Promise.resolve();
        }
    };

    return {
        navItems,
        showedNavItems,
        metaInfo,
        updateMetaByURL
    };
});
