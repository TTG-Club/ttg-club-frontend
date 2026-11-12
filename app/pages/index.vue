<script setup lang="ts">
  import { HomeComments } from '~home/comments';
  import { HomeHero } from '~home/hero';
  import { HomeLatestGame } from '~home/latest-game';
  import { HOME_VTTG_CARD } from '~home/model';
  import { HomeCommunityNews, HomeNews } from '~home/news';
  import { HomePartners } from '~home/partners';
  import { HomeSections } from '~home/sections';
  import { HomeSocialLinks } from '~home/social-links';
  import { HomePromoCard, HomeReserved } from '~home/ui-kit';

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
        order: VTTG → Соцсети → Новости → Новая игра → Новости сообщества →
        Обсуждения → Друзья.

        С xl лента делится на две половины, растянутые друг под друга, — та
        же сетка, что на new.ttg.club. Слева новости сайта, под ними две
        четверти: место в запасе и последняя новость сообщества. Справа два
        ряда из двух четвертей:

        - верхний — новая игра и VTTG с соцсетями. Ряд `stretch`, поэтому низ
          игры совпадает с низом соцсетей: разницу забирает обложка игры;
        - нижний — обсуждения и друзья, оба начинаются с одной линии и равны
          по высоте. Ряд добирает правую половину до низа левой, а сами
          панели в его высоте не участвуют (`detached`) и прокручиваются
          внутри.

        Связать высоты можно только у соседей по одному ряду — поэтому игра
        и VTTG стоят в общем ряду, а не в разных столбцах.
      -->
      <div class="flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3">
          <HomeNews class="order-2 xl:order-0" />

          <div class="contents xl:flex xl:flex-auto xl:items-stretch xl:gap-3">
            <!-- Место в запасе под будущий блок (на new.ttg.club здесь
              статьи). Ниже xl его нет: в ленте одним столбцом пустая
              заглушка только удлиняла бы страницу -->
            <HomeReserved class="hidden xl:flex xl:min-w-0 xl:flex-1" />

            <HomeCommunityNews
              class="order-4 xl:order-0 xl:min-w-0 xl:flex-1"
            />
          </div>
        </div>

        <div class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3">
          <div class="contents xl:flex xl:items-stretch xl:gap-3">
            <HomeLatestGame class="order-3 xl:order-0 xl:min-w-0 xl:flex-1" />

            <div
              class="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-3"
            >
              <HomePromoCard
                :card="HOME_VTTG_CARD"
                class="order-0 xl:flex-auto"
              />

              <HomeSocialLinks class="order-1 xl:order-0" />
            </div>
          </div>

          <!-- min-h — страховка на случай, когда левая половина короче
            обычного (скажем, новости не загрузились): без неё лентам
            досталась бы только шапка -->
          <div class="contents xl:flex xl:flex-auto xl:items-stretch xl:gap-3">
            <HomeComments
              class="order-5 xl:order-0 xl:min-h-80 xl:min-w-0 xl:flex-1"
            />

            <HomePartners
              class="order-6 xl:order-0 xl:min-h-80 xl:min-w-0 xl:flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
