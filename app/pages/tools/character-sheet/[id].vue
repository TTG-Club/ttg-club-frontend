<script setup lang="ts">
  import { CharacterSheetAccessGate } from '~character-sheet/gate';
  import { CharacterSheetEditor } from '~character-sheet/sheet';

  definePageMeta({ layout: 'section' });

  // Лист приватен, поисковикам он не нужен
  useSeoMeta({ robots: 'noindex, nofollow' });

  const route = useRoute();

  const id = computed(() => {
    const { id: param } = route.params;

    return typeof param === 'string' && param ? param : '';
  });
</script>

<template>
  <ClientOnly>
    <CharacterSheetAccessGate>
      <CharacterSheetEditor :id="id" />
    </CharacterSheetAccessGate>
  </ClientOnly>
</template>
