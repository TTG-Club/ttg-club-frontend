<script setup lang="ts">
  import { HomeHero } from '~home/hero';
  import { HomeLatestGame } from '~home/latest-game';
  import {
    HOME_DISCORD_BOT_CARD,
    HOME_TOKENATOR_CARD,
    HOME_VTTG_CARD,
  } from '~home/model';
  import { HomePartners } from '~home/partners';
  import { HomeSections } from '~home/sections';
  import { HomeSocialLinks } from '~home/social-links';
  import { HomePromoCard } from '~home/ui-kit';
  import { HomeVideos } from '~home/videos';

  definePageMeta({
    layout: 'home',
  });
</script>

<template>
  <div>
    <HomeHero />

    <!-- Плита разделов и лента — разные по смыслу полосы, им нужен воздух
      шире, чем зазор между соседними панелями внутри ленты -->
    <div
      class="mx-auto flex w-full max-w-(--max-content) flex-col gap-6 px-4 pt-6 pb-8 lg:gap-8 lg:pt-8 xl:px-6 2xl:max-w-(--max-content-wide)"
    >
      <HomeSections />

      <!--
        Ниже xl все обёртки схлопываются в display: contents: блоки становятся
        прямыми флекс-элементами ленты и выстраиваются одним потоком в порядке
        order: VTTG → Соцсети → Видео → Новая игра → Токенатор → Discord Bot →
        Друзья.

        С xl лента делится на две половины, растянутые друг под друга. Слева
        видео. Справа два узких столбца: игра с Токенатором и Discord Bot, и
        VTTG с соцсетями и друзьями. Столбцы стоят в одном ряду `stretch`,
        поэтому их низы совпадают: высоту задаёт столбец с игрой, обложка игры
        забирает разницу, а друзья занимают остаток под соцсетями и
        прокручиваются. VTTG и промо-карточки остаются своей высоты. Видео
        добирает высоту до правой половины, чтобы низ ленты шёл одной линией.
      -->
      <div class="flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3">
          <HomeVideos class="order-2 xl:order-0 xl:flex-auto" />
        </div>

        <div class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3">
          <div class="contents xl:flex xl:flex-auto xl:items-stretch xl:gap-3">
            <div
              class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3"
            >
              <HomeLatestGame class="order-3 xl:order-0 xl:flex-auto" />

              <HomePromoCard
                :card="HOME_TOKENATOR_CARD"
                compact
                class="order-4 xl:order-0"
              />

              <HomePromoCard
                :card="HOME_DISCORD_BOT_CARD"
                compact
                class="order-5 xl:order-0"
              />
            </div>

            <div
              class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3"
            >
              <HomePromoCard
                :card="HOME_VTTG_CARD"
                class="order-0"
              />

              <HomeSocialLinks class="order-1 xl:order-0" />

              <!-- Друзей много, и в узкой колонке список вытянул бы всю ленту.
                Поэтому он не участвует в высоте ряда (flex-basis 0): берёт то,
                что осталось в колонке под соцсетями, и прокручивается внутри -->
              <HomePartners
                class="order-6 xl:order-0 xl:min-h-60 xl:flex-[1_1_0]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
