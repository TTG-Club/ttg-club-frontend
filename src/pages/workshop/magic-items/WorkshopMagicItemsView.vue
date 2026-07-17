<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская магических предметов">
    <div class="workshop-magic-items">
      <router-link
        class="workshop-magic-items__action"
        to="/workshop/magic-items/create"
      >
        Создать магический предмет
      </router-link>

      <router-link
        class="workshop-magic-items__action"
        to="/items/magic"
      >
        Открыть справочник для выбора магического предмета
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-magic-items {
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
