<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская заклинаний">
    <div class="workshop-spells">
      <router-link
        class="workshop-spells__action"
        to="/workshop/spells/create"
      >
        Создать заклинание
      </router-link>

      <router-link
        class="workshop-spells__action"
        to="/spells"
      >
        Открыть справочник для выбора заклинания
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-spells {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    &__action {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-height: 40px;
      padding: 8px 14px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
  }
</style>
