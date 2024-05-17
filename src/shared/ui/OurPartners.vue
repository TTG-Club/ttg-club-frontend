<script setup lang="ts">
  import { orderBy } from 'lodash-es';
  import { computed, onBeforeMount, ref } from 'vue';

  import { httpClient } from '@/shared/api';
  import type { TPartner } from '@/shared/stores/NavStore';

  const partners = ref<TPartner[]>([]);

  const showedPartners = computed(() =>
    orderBy(partners.value, ['order'], ['asc']),
  );

  const initPartners = async () => {
    if (partners.value.length) {
      return Promise.resolve();
    }

    try {
      const resp = await httpClient.get<Array<TPartner>>({
        url: '/partners',
      });

      if (resp.status === 200) {
        partners.value = resp.data;

        return Promise.resolve();
      }

      return Promise.reject(resp.statusText);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  onBeforeMount(() => {
    initPartners();
  });
</script>

<template>
  <div
    v-if="showedPartners.length"
    class="row"
  >
    <div class="links_block">
      <h3>Наши друзья:</h3>

      <div class="list">
        <a
          v-for="(partner, key) in showedPartners"
          :key="key"
          v-tippy="{
            content: partner.description,
          }"
          :href="partner.url"
          class="chips tip"
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            :alt="partner.name"
            :src="partner.img"
            height="20px"
            width="20px"
          />
          {{ partner.name }}
        </a>
      </div>
    </div>
  </div>
</template>
