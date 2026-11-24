<script setup lang="ts">
  import { CharacterSheetAccessGate } from '~character-sheet/gate';
  import { CharacterSheetList } from '~character-sheet/list';
  import { SHEET_TEXT } from '~character-sheet/model';

  definePageMeta({ layout: 'section' });

  // Пока лист в работе, поисковикам он не нужен
  useSeoMeta({ title: SHEET_TEXT.listTitle, robots: 'noindex, nofollow' });
</script>

<template>
  <ClientOnly>
    <CharacterSheetAccessGate>
      <CharacterSheetList />
    </CharacterSheetAccessGate>
  </ClientOnly>
</template>
