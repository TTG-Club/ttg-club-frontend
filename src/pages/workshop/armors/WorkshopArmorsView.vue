<script setup lang="ts">
  import ContentLayout from '@/layouts/ContentLayout.vue';
</script>

<template>
  <content-layout title="Мастерская доспехов">
    <div class="workshop-armors">
      <router-link
        class="workshop-armors__action"
        to="/workshop/armors/create"
      >
        Создать доспех
      </router-link>

      <router-link
        class="workshop-armors__action"
        to="/armors"
      >
        Открыть справочник для выбора доспеха
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  .workshop-armors {
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
