<script>
  import { defineComponent } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  export default defineComponent({
    components: {
      SvgIcon,
    },
    props: {
      links: {
        type: Array,
        default: () => [
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
      },
    },
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
    background-color: var(--hover);
    border-radius: 12px;
    padding: 32px;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    gap: 32px;

    @media (max-width: 600px) {
      flex-direction: column;
      padding: 16px;
      gap: 16px;
    }

    &__text {
      flex: 1 1 auto;

      @media (max-width: 600px) {
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
      @include css_anim();

      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: var(--text-color);

      &:hover {
        color: var(--primary-hover);
      }
    }
  }
</style>
