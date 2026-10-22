<script setup lang="ts">
  import type { EntryName } from '~section/model';

  import { spellDetailSchema } from '~character/model';
  import { SpellBody } from '~character/spells';
  import { getEntryApiPath } from '~section/model';

  /**
   * Заклинание свитка под описанием предмета, как в старом SPA: свиток
   * без него бесполезен.
   */
  const { spell } = defineProps<{
    spell: {
      name: EntryName;
      url: string;
    };
  }>();

  const { data, status } = useAsyncData(
    () => `tools-loot-spell:${spell.url}`,
    async () =>
      spellDetailSchema.parse(
        await $fetch(getEntryApiPath(spell.url), { method: 'POST' }),
      ),
    { server: false, deep: false },
  );

  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );
</script>

<template>
  <section class="mt-6 flex flex-col gap-4 border-t border-default pt-6">
    <div>
      <h3 class="font-serif text-xl text-title">
        {{ spell.name.rus }}
      </h3>

      <p class="text-sm text-muted">
        {{ spell.name.eng }}
      </p>
    </div>

    <USkeleton
      v-if="isLoading"
      class="h-32 w-full"
    />

    <SpellBody
      v-else-if="data"
      :spell="data"
    />
  </section>
</template>
