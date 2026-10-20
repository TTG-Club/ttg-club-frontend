<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская снаряжения">
    <div class="workshop-items">
      <router-link
        class="workshop-items__action"
        to="/workshop/items/create"
      >
        Создать снаряжение
      </router-link>

      <router-link
        class="workshop-items__action"
        to="/items"
      >
        Открыть справочник для выбора снаряжения
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-items {
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
