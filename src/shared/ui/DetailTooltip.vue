<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';
  import { computed, h, ref, useSlots } from 'vue';
  import { Tippy } from 'vue-tippy';

  import { DefaultTippyProps } from '@/core/configs/TippyConfig';

  import { useAxios } from '@/shared/composables/useAxios';
  import { errorHandler } from '@/shared/helpers/errorHandler';
  import RawContent from '@/shared/ui/RawContent.vue';

  import OptionBody from '@/pages/character/options/options-detail/OptionBody.vue';
  import SpellBody from '@/pages/character/spells/spells-detail/SpellBody.vue';
  import TraitBody from '@/pages/character/traits/traits-detail/TraitBody.vue';
  import ArmorBody from '@/pages/inventory/armors/armors-detail/ArmorBody.vue';
  import ItemBody from '@/pages/inventory/items/items-detail/ItemBody.vue';
  import MagicItemBody from '@/pages/inventory/magic-items/magic-items-detail/MagicItemBody.vue';
  import WeaponBody from '@/pages/inventory/weapons/weapons-detail/WeaponBody.vue';
  import GodBody from '@/pages/wiki/gods/gods-detail/GodBody.vue';
  import CreatureBody from '@/pages/workshop/bestiary/creature-detail/CreatureBody.vue';
  import ScreenBody from '@/pages/workshop/screens/screens-detail/ScreenBody.vue';

  import type { DefaultProps } from 'tippy.js';
  import type { Component } from 'vue';

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

  const props = withDefaults(
    defineProps<{
      url?: string;
      type?: TDetailType;
    }>(),
    {
      url: undefined,
      type: undefined,
    },
  );

  const slots = useSlots();
  const http = useAxios();

  const content = ref();
  const error = ref(false);

  const computedUrl = computed(() => {
    if (props.url) {
      return props.url;
    }

    const el = slots.default?.().find(node => node?.props?.href);

    if (el?.props?.href) {
      return el.props.href;
    }

    return null;
  });

  const components: Record<TDetailType, Component> = {
    'option': OptionBody,
    'trait': TraitBody,
    'armor': ArmorBody,
    'weapon': WeaponBody,
    'magic-item': MagicItemBody,
    'item': ItemBody,
    'screen': ScreenBody,
    'creature': CreatureBody,
    'spell': SpellBody,
    'god': GodBody,
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

  const tippyConfig = computed<DefaultProps>(() => {
    const config = cloneDeep<DefaultProps>(DefaultTippyProps);

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
      'in-tooltip': true,
    });
  });
</script>

<template>
  <tippy v-bind="tippyConfig">
    <template #default>
      <slot name="default" />
    </template>

    <template #content>
      <render />
    </template>
  </tippy>
</template>
