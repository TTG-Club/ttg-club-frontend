<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская оружия">
    <div class="workshop-weapons">
      <router-link
        class="workshop-weapons__action"
        to="/workshop/weapons/create"
      >
        Создать оружие
      </router-link>

      <router-link
        class="workshop-weapons__action"
        to="/weapons"
      >
        Открыть справочник для выбора оружия
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-weapons {
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
