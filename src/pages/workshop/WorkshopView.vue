<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  const sections = [
    {
      title: 'Заклинания',
      description: 'Создание и редактирование заклинаний справочника.',
      url: '/workshop/spells',
      createUrl: '/workshop/spells/create',
    },
    {
      title: 'Существа',
      description: 'Создание и редактирование существ бестиария.',
      url: '/workshop/bestiary',
      createUrl: '/workshop/bestiary/create',
    },
    {
      title: 'Черты',
      description: 'Создание и редактирование черт справочника.',
      url: '/workshop/feats',
      createUrl: '/workshop/feats/create',
    },
    {
      title: 'Особенности классов',
      description:
        'Создание и редактирование особенностей классов справочника.',
      url: '/workshop/options',
      createUrl: '/workshop/options/create',
    },
    {
      title: 'Предыстории',
      description: 'Создание и редактирование предысторий справочника.',
      url: '/workshop/backgrounds',
      createUrl: '/workshop/backgrounds/create',
    },
    {
      title: 'Классы',
      description: 'Создание и редактирование классов справочника.',
      url: '/workshop/classes',
      createUrl: '/workshop/classes/create',
    },
    {
      title: 'Расы',
      description: 'Создание и редактирование рас справочника.',
      url: '/workshop/races',
      createUrl: '/workshop/races/create',
    },
    {
      title: 'Оружие',
      description: 'Создание и редактирование оружия справочника.',
      url: '/workshop/weapons',
      createUrl: '/workshop/weapons/create',
    },
    {
      title: 'Доспехи',
      description: 'Создание и редактирование доспехов справочника.',
      url: '/workshop/armors',
      createUrl: '/workshop/armors/create',
    },
    {
      title: 'Магические предметы',
      description:
        'Создание и редактирование магических предметов справочника.',
      url: '/workshop/magic-items',
      createUrl: '/workshop/magic-items/create',
    },
  ];
</script>

<template>
  <page-layout>
    <template #title>Мастерская</template>

    <div class="workshop">
      <article
        v-for="section in sections"
        :key="section.url"
        class="workshop__card"
      >
        <div class="workshop__card_body">
          <h2 class="workshop__card_title">
            {{ section.title }}
          </h2>

          <p class="workshop__card_description">
            {{ section.description }}
          </p>
        </div>

        <div class="workshop__card_actions">
          <router-link :to="section.createUrl">Добавить</router-link>

          <router-link :to="section.url">Открыть раздел</router-link>
        </div>
      </article>
    </div>
  </page-layout>
</template>

<style lang="scss" scoped>
  .workshop {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 16px;

    &__card {
      display: flex;
      flex-direction: column;

      min-height: 160px;
      padding: 24px;

      background-color: var(--bg-secondary);
      border-radius: 8px;

      &_body {
        flex: 1 1 auto;
      }

      &_title {
        margin: 0;
        font-size: var(--h4-font-size);
        line-height: var(--h4-line-height);
      }

      &_description {
        margin: 12px 0 0;
        color: var(--text-color);
      }

      &_actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        margin-top: 20px;
        padding-top: 16px;

        border-top: 1px solid var(--border);
      }
    }

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
