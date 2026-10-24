<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { useSectionOpener } from '~section/composables';

  import { CharacterLinkPicker } from '../link-card';
  import { RACE_TEXT } from '../model';

  /**
   * Переходы со страницы расы, как у классов: к основной расе и к её
   * разновидностям. Открываются так, как велит режим раздела.
   */
  const { baseRace, path } = defineProps<{
    baseRace: RaceLink;
    /** Адрес открытой записи: расы или разновидности. */
    path: string;
  }>();

  const router = useRouter();
  const opener = useSectionOpener();

  const subraces = computed(() => baseRace.subraces ?? []);

  /**
   * Открывает расу или разновидность через страницу раздела, а вне раздела
   * переходит на её страницу.
   * @param url - адрес расы или разновидности
   */
  function openEntry(url: string): void {
    if (opener) {
      opener.open(url);

      return;
    }

    router.push(url);
  }

  /**
   * Возврат к основной расе без ухода со страницы раздела.
   * @param event - клик по ссылке
   */
  function openRace(event: MouseEvent): void {
    if (!opener) {
      return;
    }

    event.preventDefault();
    opener.open(baseRace.url);
  }
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      :to="baseRace.url"
      :active="path === baseRace.url"
      active-variant="subtle"
      variant="soft"
      color="neutral"
      @click.left.exact.capture="openRace"
    >
      <span class="flex flex-col items-start leading-tight">
        <span class="text-xs text-muted">{{ RACE_TEXT.raceLabel }}</span>

        <span>{{ baseRace.name.rus }}</span>
      </span>
    </UButton>

    <CharacterLinkPicker
      v-if="subraces.length"
      :label="RACE_TEXT.subraceLabel"
      :placeholder="RACE_TEXT.searchSubrace"
      :empty-text="RACE_TEXT.chooseSubrace"
      :links="subraces"
      :active-path="path"
      @select="openEntry"
    />
  </div>
</template>
