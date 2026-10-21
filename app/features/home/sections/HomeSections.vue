<script setup lang="ts">
  import { useHomeLink, useHomeMenu } from '../composables';
  import { HOME_EDITION_CARD, HOME_LINK_ARROW_ICON } from '../model';
  import { HomePromoCard } from '../ui-kit';

  const { sections } = useHomeMenu();
  const { isExternalLink } = useHomeLink();
</script>

<template>
  <div class="grid w-full grid-cols-1 gap-3 xl:grid-cols-6">
    <!--
      Разделы — одна плита, разбитая волосяными линиями, а не россыпь отдельных
      карточек. Плитку опознают иконка и подпись, а картинка обесцвечена и
      работает фактурой — цвет она набирает только под курсором.
    -->
    <div
      class="overflow-hidden rounded-xl border border-default bg-muted xl:col-span-5"
    >
      <!--
        Линии рисуют сами плитки верхней и левой гранью, а сетка сдвинута на
        пиксель вверх и влево — так грани первого ряда и первой колонки уходят
        под рамку плиты. Приём не зависит от того, заполнен ли последний ряд:
        при любом числе колонок висящих линий не остаётся.
      -->
      <div
        class="-mt-px -ml-px grid h-full grid-cols-2 max-2xs:grid-cols-1 min-[1920px]:grid-cols-6 md:grid-cols-3 lg:grid-cols-4 xl:auto-rows-fr"
      >
        <NuxtLink
          v-for="section in sections"
          :key="section.url"
          :to="section.url"
          :external="isExternalLink(section.url, section.external)"
          :class="$style.cell"
          class="border-t border-l border-default"
        >
          <span
            v-if="section.textureStyle"
            :style="section.textureStyle"
            aria-hidden="true"
            :class="$style.texture"
          />

          <span :class="$style.badge">
            <UIcon
              :name="section.icon"
              class="size-4.5"
            />
          </span>

          <span :class="$style.name">{{ section.name }}</span>

          <UIcon
            :name="HOME_LINK_ARROW_ICON"
            :class="$style.arrow"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Ниже xl карточка редакции уходит под плиту, с xl — встаёт справа на
      всю её высоту -->
    <HomePromoCard
      :card="HOME_EDITION_CARD"
      compact
      muted
      class="order-last xl:order-0"
    />
  </div>
</template>

<style lang="scss" module>
  .cell {
    position: relative;

    overflow: hidden;
    display: flex;
    gap: 10px;
    align-items: center;

    min-height: 64px;
    padding: 0 12px;

    text-decoration: none;

    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--hover);

      .texture {
        transform: scale(1.06);
        opacity: 0.5;
        filter: grayscale(0) brightness(1);
      }

      .badge {
        border-color: var(--primary);
        color: var(--text-color-title);
        background-color: var(--primary-select);
      }

      .name {
        color: var(--text-color-title);
      }

      .arrow {
        transform: translateX(0);
        opacity: 1;
      }
    }
  }

  /* Картинка — фактура, а не иллюстрация: обесцвечена, приглушена и
     растворена слева, чтобы не лезть под подпись. Цвет набирает только под
     курсором. brightness сбивает пересветы — иначе обесцвеченный огненный
     шар «Заклинаний» превращается в белое пятно */
  .texture {
    pointer-events: none;

    position: absolute;
    inset: 0;

    opacity: 0.24;
    background-repeat: no-repeat;
    background-position-x: right;
    filter: grayscale(1) brightness(0.85);

    mask-image: linear-gradient(to right, transparent 0%, #000 60%, #000 100%);

    transition:
      opacity 0.25s ease,
      filter 0.25s ease,
      transform 0.25s ease;
  }

  .badge {
    position: relative;
    z-index: 1;

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 8px;

    color: var(--primary);

    background-color: var(--bg-light-main);

    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      background-color 0.2s ease;
  }

  .name {
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

  .arrow {
    position: relative;
    z-index: 1;
    transform: translateX(-4px);

    flex-shrink: 0;

    width: 16px;
    height: 16px;

    color: var(--primary);

    opacity: 0;

    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
</style>
