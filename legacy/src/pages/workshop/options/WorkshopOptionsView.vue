<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская особенностей классов">
    <div class="workshop-options">
      <router-link
        class="workshop-options__action"
        to="/workshop/options/create"
      >
        Создать особенность
      </router-link>

      <router-link
        class="workshop-options__action"
        to="/options"
      >
        Открыть справочник для выбора особенности
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-options {
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
