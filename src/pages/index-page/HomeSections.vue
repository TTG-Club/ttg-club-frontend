<script setup lang="ts">
  import { useNavStore } from '@/shared/stores/NavStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import HomePromoCard from './HomePromoCard.vue';
  import {
    getHomeSections,
    HOME_EDITION_CARD,
    HOME_LINK_ARROW_ICON,
  } from './model';

  const { showedNavItems } = storeToRefs(useNavStore());

  const sections = computed(() => getHomeSections(showedNavItems.value));
</script>

<template>
  <div class="home-sections">
    <!--
      Разделы — одна плита, разбитая волосяными линиями, а не россыпь отдельных
      карточек. Плитку опознают иконка и подпись, а картинка обесцвечена и
      работает фактурой — цвет она набирает только под курсором.
    -->
    <div class="home-sections__plate">
      <!--
        Линии рисуют сами плитки верхней и левой гранью, а сетка сдвинута на
        пиксель вверх и влево — так грани первого ряда и первой колонки уходят
        под рамку плиты. Приём не зависит от того, заполнен ли последний ряд:
        при любом числе колонок висящих линий не остаётся.
      -->
      <div class="home-sections__grid">
        <router-link
          v-for="section in sections"
          :key="section.url"
          :to="{ path: section.url }"
          class="home-sections__cell"
        >
          <span
            v-if="section.textureStyle"
            :style="section.textureStyle"
            aria-hidden="true"
            class="home-sections__texture"
          />

          <span class="home-sections__badge">
            <svg-icon
              :icon="section.icon"
              :size="18"
            />
          </span>

          <span class="home-sections__name">{{ section.name }}</span>

          <svg-icon
            :icon="HOME_LINK_ARROW_ICON"
            :size="16"
            class="home-sections__arrow"
          />
        </router-link>
      </div>
    </div>

    <home-promo-card
      :card="HOME_EDITION_CARD"
      compact
      fit-image-width
      muted
      class="home-sections__edition"
    />
  </div>
</template>

<style lang="scss" scoped>
  .home-sections {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    width: 100%;

    @include media-min($xl) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    &__plate {
      overflow: hidden;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;

      @include media-min($xl) {
        grid-column: span 5;
      }
    }

    // Ниже xl карточка редакции уходит под плиту, с xl — встаёт справа на
    // всю её высоту
    &__edition {
      order: 1;

      @include media-min($xl) {
        order: 0;
      }
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      height: 100%;
      margin: -1px 0 0 -1px;

      @media (max-width: 360px) {
        grid-template-columns: minmax(0, 1fr);
      }

      @include media-min($md) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      @include media-min($lg) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      // На 2K двенадцать разделов встают в два ровных ряда
      @include media-min($full_hd) {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }

      @include media-min($xl) {
        grid-auto-rows: 1fr;
      }
    }

    &__cell {
      position: relative;

      overflow: hidden;
      display: flex;
      gap: 10px;
      align-items: center;

      min-height: 64px;
      padding: 0 12px;

      text-decoration: none;

      border-top: 1px solid var(--border);
      border-left: 1px solid var(--border);

      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--hover);

        .home-sections__texture {
          transform: scale(1.06);
          opacity: 0.5;
          filter: grayscale(0) brightness(1);
        }

        .home-sections__badge {
          color: var(--text-color-title);
          background-color: var(--primary-select);
          border-color: var(--primary);
        }

        .home-sections__name {
          color: var(--text-color-title);
        }

        .home-sections__arrow {
          transform: translateX(0);
          opacity: 1;
        }
      }
    }

    /* Картинка — фактура, а не иллюстрация: обесцвечена, приглушена и
       растворена слева, чтобы не лезть под подпись. Цвет набирает только под
       курсором. brightness сбивает пересветы — иначе обесцвеченный огненный
       шар «Заклинаний» превращается в белое пятно. */
    &__texture {
      pointer-events: none;

      position: absolute;
      inset: 0;

      opacity: 0.24;
      background-repeat: no-repeat;
      background-position-x: right;
      filter: grayscale(1) brightness(0.85);

      transition:
        opacity 0.25s ease,
        filter 0.25s ease,
        transform 0.25s ease;

      -webkit-mask-image: linear-gradient(
        to right,
        transparent 0%,
        #000 60%,
        #000 100%
      );
      mask-image: linear-gradient(
        to right,
        transparent 0%,
        #000 60%,
        #000 100%
      );
    }

    &__badge {
      position: relative;
      z-index: 1;

      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      width: 32px;
      height: 32px;

      color: var(--primary);

      background-color: var(--bg-light-main);
      border: 1px solid var(--border);
      border-radius: 8px;

      transition:
        border-color 0.2s ease,
        color 0.2s ease,
        background-color 0.2s ease;
    }

    &__name {
      position: relative;
      z-index: 1;

      flex: 1 1 auto;

      min-width: 0;

      font-size: 14px;
      font-weight: 600;
      line-height: 1.15;
      color: var(--text-color);

      transition: color 0.2s ease;
    }

    &__arrow {
      position: relative;
      z-index: 1;
      transform: translateX(-4px);

      flex-shrink: 0;

      color: var(--primary);

      opacity: 0;

      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    }
  }
</style>
