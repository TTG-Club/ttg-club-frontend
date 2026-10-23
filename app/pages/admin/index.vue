<script setup lang="ts">
  import { ADMIN_YOUTUBE_ROUTE } from '~admin/model';

  // Своего содержимого у админки нет: единственный раздел сейчас — ролики
  definePageMeta({ redirect: ADMIN_YOUTUBE_ROUTE });
</script>

<template>
  <div />
</template>
