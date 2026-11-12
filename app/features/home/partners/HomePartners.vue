<script setup lang="ts">
  import { shuffle, sortBy } from 'es-toolkit';

  import {
    HOME_PARTNERS_DATA_KEY,
    HOME_PARTNERS_ICON,
    HOME_PARTNERS_LABEL,
    HOME_PARTNERS_MARQUEE_SECONDS_PER_ITEM,
    HOME_PARTNERS_PATH,
    parseHomePartners,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  const api = useApi();

  // Блок необязательный: при ошибке запроса его просто нет
  const { data: partners } = useAsyncData(
    HOME_PARTNERS_DATA_KEY,
    async () => parseHomePartners(await api(HOME_PARTNERS_PATH)),
    { default: () => [] },
  );

  // Сервер отдаёт друзей в заданном порядке — так их видят поисковики и те,
  // у кого нет скриптов. В браузере порядок перемешивается при каждом
  // заходе: в бегущей строке первыми видны не одни и те же
  const isShuffled = ref(false);

  const orderedPartners = computed(() =>
    isShuffled.value
      ? shuffle(partners.value)
      : sortBy(partners.value, ['order']),
  );

  onMounted(() => {
    isShuffled.value = true;
  });

  // Список в ленте повторён дважды: она сдвигается ровно на половину своей
  // длины, и стык не виден. У обеих копий плашка друга одна и та же
  const chipClass =
    'inline-flex items-center rounded-lg border border-default bg-overlay px-2.5 py-1.5 text-sm leading-5 whitespace-nowrap text-default no-underline transition-colors duration-200 hover:border-secondary-hover hover:bg-elevated hover:text-highlighted';

  // Строка едет с одной скоростью, сколько бы друзей ни было
  const trackStyle = computed(() => ({
    '--marquee-duration': `${partners.value.length * HOME_PARTNERS_MARQUEE_SECONDS_PER_ITEM}s`,
  }));
</script>

<template>
  <HomePanel
    v-if="orderedPartners.length"
    :label="HOME_PARTNERS_LABEL"
    :icon="HOME_PARTNERS_ICON"
    flush
  >
    <!--
      Бегущая строка в одну линию. Под курсором и при фокусе с клавиатуры
      она замирает, чтобы по другу можно было попасть.

      Тем, кто просил поменьше движения, и в режиме «производительность»
      строка стоит на месте и листается пальцем или колесом.
    -->
    <div
      class="overflow-hidden py-3 motion-reduce:overflow-x-auto performance:overflow-x-auto"
      :class="$style.viewport"
    >
      <div
        class="flex w-max motion-reduce:animate-none performance:animate-none"
        :class="$style.track"
        :style="trackStyle"
      >
        <ul class="flex shrink-0 gap-2 pr-2">
          <li
            v-for="partner in orderedPartners"
            :key="partner.url"
          >
            <UTooltip
              :text="partner.description"
              :disabled="!partner.description"
            >
              <a
                :href="partner.url"
                target="_blank"
                rel="noopener noreferrer"
                :class="chipClass"
              >
                {{ partner.name }}
              </a>
            </UTooltip>
          </li>
        </ul>

        <!-- Повтор списка — только для глаз: скринридер и Tab его не видят,
          а там, где строка не едет, он убран -->
        <div
          aria-hidden="true"
          class="flex shrink-0 gap-2 pr-2 motion-reduce:hidden performance:hidden"
        >
          <a
            v-for="partner in orderedPartners"
            :key="partner.url"
            :href="partner.url"
            target="_blank"
            rel="noopener noreferrer"
            tabindex="-1"
            :class="chipClass"
          >
            {{ partner.name }}
          </a>
        </div>
      </div>
    </div>
  </HomePanel>
</template>

<style lang="scss" module>
  /* Края строки растворяются: друзья выезжают из-за края, а не обрезаются */
  .viewport {
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 16px,
      #000 calc(100% - 16px),
      transparent
    );
  }

  .track {
    animation: partners-marquee var(--marquee-duration) linear infinite;
  }

  .viewport:hover .track,
  .viewport:focus-within .track {
    animation-play-state: paused;
  }

  @keyframes partners-marquee {
    from {
      transform: translateX(0);
    }

    to {
      transform: translateX(-50%);
    }
  }
</style>
