<script setup lang="ts">
  import HomeHero from './HomeHero.vue';
  import HomeLatestGame from './HomeLatestGame.vue';
  import HomePartners from './HomePartners.vue';
  import HomePromoCard from './HomePromoCard.vue';
  import HomeSections from './HomeSections.vue';
  import HomeSocialLinks from './HomeSocialLinks.vue';
  import HomeVideos from './HomeVideos.vue';
  import {
    HOME_DISCORD_BOT_CARD,
    HOME_TOKENATOR_CARD,
    HOME_VTTG_CARD,
  } from './model';
</script>

<template>
  <div class="home">
    <home-hero />

    <!-- Плита разделов и лента — разные по смыслу полосы, им нужен воздух
      шире, чем зазор между соседними панелями внутри ленты -->
    <div class="home__content">
      <home-sections />

      <!--
        Ниже xl все обёртки схлопываются в display: contents: блоки становятся
        прямыми флекс-элементами ленты и выстраиваются одним потоком в порядке
        order: VTTG → Соцсети → Видео → Новая игра → Токенатор →
        Discord Bot → Друзья.

        С xl лента делится на две половины, растянутые друг под друга. Слева
        видео. Справа ряд из двух узких столбцов — игра с Токенатором и
        Discord Bot, VTTG с соцсетями — а под ним друзья. Последний блок каждой
        половины добирает высоту до соседней,
        чтобы низ ленты шёл одной линией.
      -->
      <div class="home__feed">
        <div class="home__half">
          <home-videos class="home__videos" />
        </div>

        <div class="home__half">
          <div class="home__row">
            <div class="home__stack">
              <home-latest-game class="home__latest-game" />

              <home-promo-card
                :card="HOME_TOKENATOR_CARD"
                compact
                class="home__tokenator"
              />

              <home-promo-card
                :card="HOME_DISCORD_BOT_CARD"
                compact
                class="home__discord-bot"
              />
            </div>

            <div class="home__stack">
              <home-promo-card
                :card="HOME_VTTG_CARD"
                class="home__vttg"
              />

              <home-social-links class="home__social" />
            </div>
          </div>

          <home-partners class="home__partners" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .home {
    &__content {
      display: flex;
      flex-direction: column;
      gap: 24px;

      width: 100%;
      max-width: var(--max-content);
      margin: 0 auto;
      padding-block: 24px 32px;

      @include media-min($lg) {
        gap: 32px;
        padding-top: 32px;
      }

      // На широких мониторах колонка растёт, и ширина уходит в контент, а не
      // в пустые поля
      @include media-min($xxl) {
        max-width: var(--max-content-wide);
      }
    }

    &__feed {
      display: flex;
      flex-direction: column;
      gap: 12px;

      @include media-min($xl) {
        flex-direction: row;
        align-items: stretch;
      }
    }

    &__half,
    &__row,
    &__stack {
      display: contents;
    }

    &__vttg {
      order: 0;
    }

    &__social {
      order: 1;
    }

    &__videos {
      order: 2;
    }

    &__latest-game {
      order: 3;
    }

    &__tokenator {
      order: 4;
    }

    &__discord-bot {
      order: 5;
    }

    &__partners {
      order: 6;
    }

    @include media-min($xl) {
      &__half {
        display: flex;
        flex: 1 1 0;
        flex-direction: column;
        gap: 12px;

        min-width: 0;
      }

      &__row {
        display: flex;
        gap: 12px;
        align-items: stretch;
      }

      &__stack {
        display: flex;
        flex: 1 1 0;
        flex-direction: column;
        gap: 12px;

        min-width: 0;
      }

      &__vttg,
      &__social,
      &__videos,
      &__latest-game,
      &__tokenator,
      &__discord-bot,
      &__partners {
        order: 0;
      }

      // Карточки столбцов делят высоту ряда поровну, а последние блоки половин
      // добирают высоту до соседней половины
      &__tokenator,
      &__discord-bot,
      &__vttg,
      &__videos,
      &__partners {
        flex: 1 1 auto;
      }
    }
  }
</style>
