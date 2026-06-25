<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская рас">
    <div class="workshop-races">
      <router-link
        class="workshop-races__action"
        to="/workshop/races/create"
      >
        Создать расу
      </router-link>

      <router-link
        class="workshop-races__action"
        to="/races"
      >
        Открыть справочник для выбора расы
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-races {
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
