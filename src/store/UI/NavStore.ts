import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import orderBy from 'lodash/orderBy';
import { useAxios } from '@/common/composition/useAxios';
import isDev from '@/common/helpers/isDev';

export type TNavItem = {
    name: string
    icon?: string
    url?: string
    onlyDev?: boolean
    external?: boolean
    children?: Array<TNavItem>
    order: number
    onIndex?: boolean
    indexOrder?: number
}

export const useNavStore = defineStore('NavStore', () => {
    const http = useAxios();
    const navItems = ref<Array<TNavItem>>([]);
    const metaInfo = ref(undefined);
    const isShowPopover = ref(false);
    const isShowSearch = ref(false);

    const showedNavItems = computed(() => (
        orderBy(
            navItems.value
                .filter(group => {
                    if (isDev) {
                        return true;
                    }

                    return !group.onlyDev;
                })
                .map(group => ({
                    ...group,
                    children: orderBy(
                        group.children?.filter(link => {
                            if (isDev) {
                                return true;
                            }

                            return !link.onlyDev;
                        }) || [],
                        ['order'],
                        ['asc']
                    )
                })),
            ['order'],
            ['asc']
        )
    ));

    const indexNavItems = computed(() => {
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

        iterate(navItems.value);

        return orderBy(
            items,
            ['indexOrder'],
            ['asc']
        );
    });

    const initNavItems = async () => {
        try {
            const resp = await http.get({
                url: '/menu'
            });

            if (resp.status === 200) {
                navItems.value = resp.data;

                return Promise.resolve();
            }

            return Promise.reject(resp.statusText);
        } catch (err) {
            return Promise.reject(err);
        }
    };

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
        isShowPopover,
        isShowSearch,
        navItems,
        showedNavItems,
        indexNavItems,
        metaInfo,
        initNavItems,
        updateMetaByURL
    };
});
