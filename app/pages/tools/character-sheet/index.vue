<script setup lang="ts">
  import { CharacterSheetList } from '~character-sheet/list';
  import { SHEET_TEXT } from '~character-sheet/model';

  definePageMeta({ layout: 'section' });

  useSeoMeta({ title: SHEET_TEXT.listTitle });
</script>

<template>
  <ClientOnly>
    <CharacterSheetList />
  </ClientOnly>
</template>
