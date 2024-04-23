<script setup lang="ts">
  import { storeToRefs } from 'pinia';

  import { useNavStore } from '@/shared/stores/NavStore';

  const navStore = useNavStore();

  const { showedPartners } = storeToRefs(navStore);
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
