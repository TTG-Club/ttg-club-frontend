<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская бестиария">
    <div class="workshop-bestiary">
      <router-link
        class="workshop-bestiary__action"
        to="/workshop/bestiary/create"
      >
        Создать существо
      </router-link>

      <router-link
        class="workshop-bestiary__action"
        to="/bestiary"
      >
        Открыть бестиарий для выбора существа
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-bestiary {
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
