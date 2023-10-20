<template>
  <page-layout :use-social-links="false">
    <template #title>Токены существ</template>

    <template #default>
      <div :class="$style.page">
        <div :class="$style.filter">filter</div>

        <div :class="$style.body">
          <token-item
            v-for="token in tokens"
            :key="token.id"
            :token="token"
          />
        </div>
      </div>
    </template>
  </page-layout>
</template>

<script setup lang="ts">
  import { tryOnBeforeMount } from '@vueuse/core';
  import { ref } from 'vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import TokenItem from '@/features/tokens/TokenItem.vue';
  import type { ITokenItem } from '@/features/tokens/tokens';

  import { useAxios } from '@/shared/compositions/useAxios';
  import type { IPaginatedResponse } from '@/shared/types/BaseApiFields';

  const http = useAxios();
  const tokens = ref<Array<ITokenItem>>([]);

  const loadTokens = async () => {
    try {
      const { data } = await http.get<IPaginatedResponse<ITokenItem>>({
        url: `/tokens`
      });

      const { items } = data;

      tokens.value = items;
    } catch (err) {
      console.error(err);
    }
  };

  tryOnBeforeMount(async () => {
    await loadTokens();
  });
</script>

<style module lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .filter {
    position: sticky;
    top: 0;
    padding: 16px 0;
    margin: -16px 0 0;
    opacity: 1;
    background-color: var(--bg-main);
    z-index: 10;
  }

  .body {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 8px;
  }
</style>
