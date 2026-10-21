<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская предысторий">
    <div class="workshop-backgrounds">
      <router-link
        class="workshop-backgrounds__action"
        to="/workshop/backgrounds/create"
      >
        Создать предысторию
      </router-link>

      <router-link
        class="workshop-backgrounds__action"
        to="/backgrounds"
      >
        Открыть справочник для выбора предыстории
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-backgrounds {
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
