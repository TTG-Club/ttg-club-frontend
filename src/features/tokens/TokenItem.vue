<template>
  <a
    :href="token.url"
    :class="$style.token"
    @click.left.exact.prevent="copyLink"
  >
    <img
      v-lazy="image"
      :alt="token.name.eng"
    />

    <span
      v-tippy="{ content: token.name.rus }"
      :class="$style.name"
      >{{ token.name.rus }}</span
    >
  </a>
</template>

<script setup lang="ts">
  import { useClipboard } from '@vueuse/core';
  import { computed, h } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import type { ITokenItem } from '@/features/tokens/tokens';

  const props = defineProps<{
    token: ITokenItem;
  }>();

  const toast = useToast(ToastEventBus);

  const { copy } = useClipboard({
    legacy: true,
    source: props.token.url
  });

  const image = computed(() => ({
    src: props.token.url,
    error: '/img/no-token-round.webp'
  }));

  const copyLink = () => {
    copy()
      .then(() => {
        toast('Ссылка успешно скопирована');
      })
      .catch(() =>
        toast.error(() =>
          h('span', null, [
            'Произошла какая-то ошибка... попробуйте еще раз или обратитесь за помощью на нашем ',
            h(
              'a',
              {
                target: '_blank',
                href: 'https://discord.gg/zqBnMJVf3z',
                rel: 'noopener'
              },
              'Discord-канале'
            )
          ])
        )
      );
  };
</script>

<style module lang="scss">
  .token {
    @include css_anim();

    min-width: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--hover);
    border-radius: 4px;
    gap: 8px;
    padding: 12px;
    cursor: pointer;
    color: var(--text-color);

    &:hover {
      background-color: var(--bg-inpur-hover);
      color: var(--text-color);
    }

    &:active {
      background-color: var(--bg-light-main);
    }

    img {
      width: 100%;
    }
  }

  .name {
    display: block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
