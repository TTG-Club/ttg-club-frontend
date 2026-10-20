<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская классов">
    <div class="workshop-classes">
      <router-link
        class="workshop-classes__action"
        to="/workshop/classes/create"
      >
        Создать класс
      </router-link>

      <router-link
        class="workshop-classes__action"
        to="/classes"
      >
        Открыть справочник для выбора класса
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-classes {
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
