<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
</script>

<template>
  <div class="vttg-banner">
    <!-- Background image and overlay -->
    <div class="vttg-banner__bg-wrapper">
      <img
        :src="'/img/vttg-banner.webp'"
        alt=""
        class="vttg-banner__bg"
        aria-hidden="true"
      />

      <div class="vttg-banner__overlay" />
    </div>

    <!-- Content -->
    <div class="vttg-banner__content">
      <h2 class="vttg-banner__title">Virtual TTG Club!</h2>

      <p class="vttg-banner__desc">
        Полноценный виртуальный стол для D&D 5e с интерактивными картами,
        3D-кубиками и интеграцией с ttg.club.
      </p>
    </div>

    <!-- Actions -->
    <div class="vttg-banner__actions">
      <a
        href="https://new.ttg.club/vttg"
        target="_blank"
        rel="noopener noreferrer"
        class="vttg-btn vttg-btn-secondary"
      >
        <span>Подробнее</span>

        <svg-icon
          icon="arrow/right"
          class="vttg-icon"
        />
      </a>

      <a
        href="https://crowdrepublic.ru/projects/1073013"
        target="_blank"
        rel="noopener noreferrer"
        class="vttg-btn vttg-btn-primary"
      >
        <svg-icon
          icon="heart"
          class="vttg-icon"
        />

        <span>Поддержать проект</span>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .vttg-banner {
    --vttg-gold: oklch(0.828 0.189 84.429);

    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 24px;

    width: 100%;
    padding: 24px;

    background-color: var(--bg-sub-menu);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 10px 12px 0 var(--card-shadow);

    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @include media-min($md) {
      flex-direction: row;
      gap: 32px;
      align-items: center;
      justify-content: space-between;

      padding: 32px;
    }

    &:hover {
      border-color: color-mix(in oklch, var(--vttg-gold) 45%, transparent);
      box-shadow:
        0 12px 30px -10px rgb(0 0 0 / 60%),
        0 0 24px -6px color-mix(in oklch, var(--vttg-gold) 25%, transparent);

      .vttg-banner__bg {
        transform: scale(1.03);
      }
    }

    &__bg-wrapper {
      pointer-events: none;
      user-select: none;

      position: absolute;
      z-index: 0;
      inset: 0;
    }

    &__bg {
      width: 100%;
      height: 100%;

      opacity: 0.85;
      object-fit: cover;
      object-position: center;

      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.95) 0%,
        rgba(0, 0, 0, 0.8) 70%,
        rgba(0, 0, 0, 0.6) 100%
      );

      @include media-min($md) {
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.85) 0%,
          rgba(0, 0, 0, 0.5) 60%,
          rgba(0, 0, 0, 0.15) 100%
        );
      }
    }

    &__content {
      position: relative;
      z-index: 1;

      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    &__title {
      margin: 0;

      font-family: 'Open Sans', sans-serif;
      font-size: 20px;
      font-weight: 700;
      line-height: 1.2;
      color: #ffffff;

      @include media-min($md) {
        font-size: 24px;
      }
    }

    &__desc {
      max-width: 768px;
      margin: 0;

      font-size: 13px;
      line-height: 1.5;
      color: #c3d1da;

      @include media-min($md) {
        font-size: 14px;
      }
    }

    &__actions {
      position: relative;
      z-index: 1;

      display: flex;
      flex-shrink: 0;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      width: 100%;

      @include media-min($sm) {
        flex-wrap: nowrap;
        width: auto;
      }
    }
  }

  .vttg-btn {
    cursor: pointer;

    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    width: 100%;
    height: 44px;
    padding: 0 20px;

    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    border-radius: 8px;

    @include media-min($sm) {
      width: auto;
    }

    .vttg-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    &.vttg-btn-primary {
      color: var(--bg-main) !important;
      background-color: var(--vttg-gold) !important;
      border: 1px solid var(--vttg-gold) !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-1px);
        background-color: color-mix(
          in oklch,
          var(--vttg-gold) 90%,
          #ffffff
        ) !important;
        border-color: color-mix(
          in oklch,
          var(--vttg-gold) 90%,
          #ffffff
        ) !important;
        box-shadow: 0 6px 16px
          color-mix(in oklch, var(--vttg-gold) 35%, transparent) !important;
      }

      &:active {
        transform: translateY(0);
      }
    }

    &.vttg-btn-secondary {
      color: var(--vttg-gold) !important;
      background-color: color-mix(
        in oklch,
        var(--vttg-gold) 8%,
        transparent
      ) !important;
      border: 1px solid color-mix(in oklch, var(--vttg-gold) 35%, transparent) !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        color: var(--text-color-title) !important;
        background-color: color-mix(
          in oklch,
          var(--vttg-gold) 20%,
          transparent
        ) !important;
        border-color: var(--vttg-gold) !important;
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
</style>
