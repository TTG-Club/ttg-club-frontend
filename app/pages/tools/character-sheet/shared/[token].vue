<script setup lang="ts">
  import { CharacterSheetAccessGate } from '~character-sheet/gate';
  import { CharacterSheetEditor } from '~character-sheet/sheet';

  definePageMeta({ layout: 'section' });

  // Лист по секретной ссылке — поисковикам он не нужен
  useSeoMeta({ robots: 'noindex, nofollow' });

  const route = useRoute();

  const token = computed(() => {
    const { token: param } = route.params;

    return typeof param === 'string' && param ? param : '';
  });
</script>

<template>
  <ClientOnly>
    <CharacterSheetAccessGate>
      <CharacterSheetEditor :share-token="token" />
    </CharacterSheetAccessGate>
  </ClientOnly>
</template>
