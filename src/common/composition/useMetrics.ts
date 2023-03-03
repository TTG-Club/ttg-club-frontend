import type { MaybeRef } from '@vueuse/core';
import { unref } from 'vue';
import { event, pageview } from 'vue-gtag';
import type { RouteLocationNormalized } from 'vue-router';
import { useIsDev } from '@/common/helpers/isDev';

export const useMetrics = () => {
    const isDev = useIsDev();

    const sendSearchMetrics = (str: MaybeRef<string>) => {
        if (isDev) {
            return;
        }

        const value = unref(str);

        event('search', {
            event_category: 'engagement',
            event_label: value
        });
    };

    const sendSearchViewResultsMetrics = (str: MaybeRef<string>) => {
        if (isDev) {
            return;
        }

        const value = unref(str);

        event('view_search_results', {
            event_category: 'engagement',
            event_label: value
        });
    };

    const sendPageViewMetrics = (to: RouteLocationNormalized) => {
        if (isDev) {
            return;
        }

        pageview({
            page_path: to.path,
            page_location: window.location.href
        });
    };

    const sendSignUpMetrics = (method: MaybeRef<string> = 'default') => {
        if (isDev) {
            return;
        }

        const value = unref(method);

        event('sign_up', {
            event_category: 'engagement',
            event_label: value
        });
    };

    const sendLoginMetrics = (method: MaybeRef<string> = 'default') => {
        if (isDev) {
            return;
        }

        const value = unref(method);

        event('login', {
            event_category: 'engagement',
            event_label: value
        });
    };

    const sendShareMetrics = (method: MaybeRef<string> = 'link_copy') => {
        if (isDev) {
            return;
        }

        const value = unref(method);

        event('share', {
            event_category: 'engagement',
            event_label: value
        });
    };

    return {
        sendSearchMetrics,
        sendSearchViewResultsMetrics,
        sendPageViewMetrics,
        sendSignUpMetrics,
        sendLoginMetrics,
        sendShareMetrics
    };
};
