<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская черт">
    <div class="workshop-feats">
      <router-link
        class="workshop-feats__action"
        to="/workshop/feats/create"
      >
        Создать черту
      </router-link>

      <router-link
        class="workshop-feats__action"
        to="/feats"
      >
        Открыть справочник для выбора черты
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-feats {
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
