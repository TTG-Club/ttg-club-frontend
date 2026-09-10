<script setup lang="ts">
  import { RouterLink } from 'vue-router';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import HomeEyebrow from './HomeEyebrow.vue';
  import { HOME_LINK_ARROW_ICON } from './model';

  import type { HomePromoCardContent } from './model';

  const props = withDefaults(
    defineProps<{
      card: HomePromoCardContent;
      /** Низкая карточка — для тех, где под заголовком нет описания */
      compact?: boolean;
      /**
       * Картинка растянута на всю карточку без обрезки: у вытянутого баннера
       * при обрезке по высоте карточки видна лишь середина
       */
      stretchImage?: boolean;
      /**
       * Картинка обесцвечена, как фактуры плиты разделов, и набирает цвет
       * только под курсором
       */
      muted?: boolean;
    }>(),
    {
      compact: false,
      stretchImage: false,
      muted: false,
    },
  );

  const linkComponent = computed(() =>
    props.card.external ? 'a' : RouterLink,
  );

  const linkAttributes = computed(() =>
    props.card.external
      ? {
          href: props.card.to,
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : { to: props.card.to },
  );

  const rootClasses = computed(() => [
    'home-promo',
    {
      'home-promo_compact': props.compact,
      'home-promo_stretch': props.stretchImage,
      'home-promo_muted': props.muted,
    },
  ]);
</script>

<template>
  <!--
    Текст карточки выстроен в столбец и прижат к низу: карточки стоят и в узких
    колонках, где подпись справа от заголовка пришлось бы ломать по слогам.
    Подпись лежит на тёмной картинке во всех темах, поэтому цвет текста
    фиксированный светлый, а не тема-зависимый.
  -->
  <component
    :is="linkComponent"
    v-bind="linkAttributes"
    :class="rootClasses"
  >
    <img
      :src="card.image"
      alt=""
      aria-hidden="true"
      loading="lazy"
      class="home-promo__image"
    />

    <span class="home-promo__overlay" />

    <span class="home-promo__content">
      <home-eyebrow
        :label="card.eyebrow"
        accent
      />

      <span class="home-promo__title">{{ card.title }}</span>

      <span
        v-if="card.description"
        class="home-promo__description"
      >
        {{ card.description }}
      </span>

      <span
        v-if="card.linkLabel"
        class="home-promo__link"
      >
        {{ card.linkLabel }}

        <svg-icon
          :icon="HOME_LINK_ARROW_ICON"
          :size="16"
          class="home-promo__arrow"
        />
      </span>
    </span>
  </component>
</template>

<style lang="scss" scoped>
  .home-promo {
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    min-height: 176px;
    padding: 16px;

    text-decoration: none;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;

    transition:
      border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &_compact {
      min-height: 112px;
    }

    // Край баннера растворяется в прозрачность, а подпись светлая во всех
    // темах — под картинкой нужен тёмный фон
    &_stretch {
      background-color: var(--bg-image-backdrop);
    }

    &:hover {
      border-color: color-mix(in srgb, var(--primary) 45%, transparent);
      box-shadow:
        var(--box-shadow),
        0 0 20px -8px color-mix(in srgb, var(--primary) 30%, transparent);

      .home-promo__image {
        transform: scale(1.05);
      }

      .home-promo__arrow {
        transform: translateX(2px);
      }
    }

    &__image,
    &__overlay {
      pointer-events: none;

      position: absolute;
      inset: 0;

      width: 100%;
      height: 100%;
    }

    &__image {
      user-select: none;

      opacity: 0.85;
      object-fit: cover;
      object-position: center;

      transition:
        transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
        filter 0.25s ease;
    }

    /* Баннер виден целиком и закрывает карточку: пропорции он теряет, но
       обесцвеченным работает фактурой, а не иллюстрацией */
    &_stretch &__image {
      object-fit: fill;
    }

    /* Те же фильтры, что у фактур плиты разделов: brightness сбивает
       пересветы обесцвеченной картинки */
    &_muted &__image {
      filter: grayscale(1) brightness(0.85);
    }

    &_muted:hover &__image {
      filter: grayscale(0) brightness(1);
    }

    &__overlay {
      background: var(--bg-image-overlay);
    }

    &__content {
      position: relative;
      z-index: 1;

      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    &__title {
      font-family: 'Open Sans', sans-serif;
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      color: var(--text-btn-color);
    }

    &__description {
      font-size: 14px;
      line-height: 1.375;
      color: var(--text-btn-color);
      opacity: 0.7;
    }

    &__link {
      display: inline-flex;
      gap: 6px;
      align-items: center;

      margin-top: 4px;

      font-size: 14px;
      font-weight: 500;
      color: var(--link-color);
    }

    &__arrow {
      transition: transform 0.2s ease;
    }
  }
</style>
