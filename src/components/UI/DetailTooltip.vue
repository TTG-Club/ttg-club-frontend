<template>
    <tippy
        theme="dnd5club no-padding"
        v-bind="tippyConfig"
    >
        <template #default>
            <slot name="default" />
        </template>

        <template #content>
            <render />
        </template>
    </tippy>
</template>

<script setup lang="ts">
    import cloneDeep from 'lodash/cloneDeep';
    import type { Component } from 'vue';
    import {
        computed, h, ref, useSlots
    } from 'vue';
    import { Tippy } from 'vue-tippy';
    import { useAxios } from '@/common/composition/useAxios';
    import errorHandler from '@/common/helpers/errorHandler';
    import { DefaultTippyProps } from '@/common/utils/TippyConfig';
    import SpellBody from '@/views/Character/Spells/SpellBody.vue';
    import ScreenBody from '@/views/Workshop/Screens/ScreenBody.vue';
    import ItemBody from '@/views/Inventory/Items/ItemBody.vue';
    import ArmorBody from '@/views/Inventory/Armors/ArmorBody.vue';
    import WeaponBody from '@/views/Inventory/Weapons/WeaponBody.vue';
    import CreatureBody from '@/views/Workshop/Bestiary/CreatureBody.vue';
    import MagicItemBody from '@/views/Inventory/MagicItems/MagicItemBody.vue';
    import OptionBody from '@/views/Character/Options/OptionBody.vue';
    import TraitBody from '@/views/Character/Traits/TraitBody.vue';
    import GodBody from '@/views/Wiki/Gods/GodBody.vue';
    import RawContent from '@/components/content/RawContent.vue';

    type TDetailType =
        | 'option'
        | 'trait'
        | 'armor'
        | 'weapon'
        | 'magic-item'
        | 'item'
        | 'screen'
        | 'creature'
        | 'spell'
        | 'god';

    const props = withDefaults(defineProps<{
        url?: string;
        type?: TDetailType
    }>(), {
        url: undefined,
        type: undefined
    });

    const slots = useSlots();
    const http = useAxios();

    const content = ref();
    const error = ref(false);

    const computedUrl = computed(() => {
        if (props.url) {
            return props.url;
        }

        const el = slots.default?.()
            .find(node => node?.props?.href);

        if (el?.props?.href) {
            return el.props.href;
        }

        return null;
    });

    const components: { [key in TDetailType]: Component } = {
        'option': OptionBody,
        'trait': TraitBody,
        'armor': ArmorBody,
        'weapon': WeaponBody,
        'magic-item': MagicItemBody,
        'item': ItemBody,
        'screen': ScreenBody,
        'creature': CreatureBody,
        'spell': SpellBody,
        'god': GodBody
    };

    const getContent = async () => {
        error.value = false;

        if (content.value) {
            return true;
        }

        if (!computedUrl.value) {
            error.value = true;

            return false;
        }

        const res = !props.type
            ? await http.rawGet({ url: computedUrl.value })
            : await http.post({ url: computedUrl.value });

        if (res.status !== 200) {
            errorHandler(res.statusText);

            error.value = true;

            return false;
        }

        content.value = res.data;

        return true;
    };

    const tippyConfig = computed(() => {
        const config = cloneDeep(DefaultTippyProps);

        config.onTrigger = () => getContent();

        return config;
    });

    const render = computed(() => {
        if (!content.value && error.value) {
            return h('span', null, 'Произошла непредвиденная ошибка');
        }

        if (!content.value && !error.value) {
            return h('span', null, 'Загрузка...');
        }

        if (!props.type) {
            return h(RawContent, { template: content.value || 'Загрузка...' });
        }

        return h(components[props.type], {
            [props.type]: content.value,
            'in-tooltip': true
        });
    });
</script>
