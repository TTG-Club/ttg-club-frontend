<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { VTTG_PROMO_CARD } from './constants';
</script>

<template>
  <a
    :href="VTTG_PROMO_CARD.href"
    class="vttg-promo"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      :src="VTTG_PROMO_CARD.imageUrl"
      alt=""
      aria-hidden="true"
      class="vttg-promo__background"
    />

    <span class="vttg-promo__overlay" />

    <span class="vttg-promo__content">
      <span class="vttg-promo__eyebrow">
        {{ VTTG_PROMO_CARD.eyebrow }}
      </span>

      <span class="vttg-promo__title">
        {{ VTTG_PROMO_CARD.title }}
      </span>

      <span class="vttg-promo__description">
        {{ VTTG_PROMO_CARD.description }}
      </span>

      <span class="vttg-promo__link">
        {{ VTTG_PROMO_CARD.linkLabel }}

        <svg-icon
          :icon="VTTG_PROMO_CARD.linkIcon"
          class="vttg-promo__icon"
        />
      </span>
    </span>
  </a>
</template>

<style lang="scss" scoped>
  .vttg-promo {
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    min-height: 176px;
    padding: 16px;

    text-decoration: none;

    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 10px 12px 0 var(--card-shadow);

    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: color-mix(in oklch, var(--primary) 45%, transparent);
      box-shadow:
        0 12px 30px -12px rgb(0 0 0 / 60%),
        0 0 20px -8px color-mix(in oklch, var(--primary) 30%, transparent);

      .vttg-promo__background {
        transform: scale(1.05);
      }

      .vttg-promo__icon {
        transform: translateX(2px);
      }
    }

    &__background,
    &__overlay {
      pointer-events: none;

      position: absolute;
      inset: 0;

      width: 100%;
      height: 100%;
    }

    &__background {
      opacity: 0.85;
      object-fit: cover;
      object-position: center;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    // Горизонтальный слой держит контраст под текстом, вертикальный затемняет низ.
    &__overlay {
      background: linear-gradient(
          to right,
          rgb(0 0 0 / 88%) 0%,
          rgb(0 0 0 / 62%) 65%,
          rgb(0 0 0 / 30%) 100%
        ),
        linear-gradient(to top, rgb(0 0 0 / 70%) 0%, rgb(0 0 0 / 15%) 100%);
    }

    &__content {
      position: relative;
      z-index: 1;

      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;
    }

    &__eyebrow {
      font-size: 10px;
      font-weight: 700;
      color: var(--link-color);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    &__title {
      font-family: 'Open Sans', sans-serif;
      font-size: var(--h3-font-size);
      font-weight: 700;
      line-height: 1.2;
      color: var(--text-btn-color);
    }

    &__description {
      font-size: calc(var(--main-font-size) - 2px);
      line-height: 1.4;
      color: var(--text-btn-color);
      opacity: 0.75;
    }

    &__link {
      display: inline-flex;
      gap: 6px;
      align-items: center;

      margin-top: 4px;

      font-size: calc(var(--main-font-size) - 1px);
      font-weight: 600;
      color: var(--link-color);
    }

    &__icon {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }
  }
</style>
