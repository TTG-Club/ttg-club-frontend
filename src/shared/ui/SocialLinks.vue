<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  type SocialLinkItem = {
    name: string;
    url: string;
    icon: string;
  };

  type Props = {
    links?: Array<SocialLinkItem>;
  };

  withDefaults(defineProps<Props>(), {
    links: () => [
      {
        name: 'Discord',
        url: 'https://discord.gg/JqFKMKRtxv',
        icon: 'discord',
      },
      {
        name: 'ВКонтакте',
        url: 'https://vk.com/ttg.club',
        icon: 'vk',
      },
    ],
  });
</script>

<template>
  <div class="social-links">
    <h5 class="social-links__text">
      <slot name="default">
        Советуем подписаться, чтобы быть в курсе всех новостей!
      </slot>
    </h5>

    <div class="social-links__links">
      <a
        v-for="(link, index) in links"
        :key="index"
        :href="link.url"
        class="social-links__link"
        rel="noopener noreferrer"
        target="_blank"
      >
        <svg-icon :icon="link.icon" />
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .social-links {
    display: flex;
    flex-direction: row;
    gap: 32px;
    align-items: center;
    justify-content: space-between;

    padding: 32px;

    background-color: var(--hover);
    border-radius: 12px;

    &__text {
      flex: 1 1 auto;

      @media (width <= 600px) {
        width: auto;
        text-align: center;
      }
    }

    &__links {
      display: flex;
      flex-shrink: 0;
      gap: 16px;
    }

    &__link {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 48px;
      height: 48px;

      font-size: 36px;
      color: var(--text-color);

      @include css-anim;

      &:hover {
        color: var(--primary-hover);
      }
    }

    @media (width <= 600px) {
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }
  }
</style>
