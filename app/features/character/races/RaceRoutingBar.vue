<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { useSectionOpener } from '~section/composables';

  import { CharacterLinkPicker } from '../link-card';
  import { RACE_TEXT } from '../model';

  /**
   * Переходы со страницы расы, как у классов: к основной расе и к её
   * разновидностям. Открываются так, как велит режим раздела. В слоте
   * размещаются дополнительные кнопки, например описание.
   */
  const { baseRace, path } = defineProps<{
    baseRace?: RaceLink | null;
    /** Адрес открытой записи: расы или разновидности. */
    path: string;
  }>();

  defineSlots<{
    /** Кнопки страницы расы после переходов, например описание. */
    default?: () => unknown;
  }>();

  const router = useRouter();
  const opener = useSectionOpener();

  const subraces = computed(() => baseRace?.subraces ?? []);

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
    if (!opener || !baseRace) {
      return;
    }

    event.preventDefault();
    opener.open(baseRace.url);
  }
</script>

<template>
  <div
    class="grid grid-cols-2 gap-2 @min-2xl:flex @min-2xl:items-start [&:has(>div>:nth-child(even):last-child)>:last-child]:col-span-2"
  >
    <div
      class="contents @min-2xl:flex @min-2xl:min-w-0 @min-2xl:flex-1 @min-2xl:flex-wrap @min-2xl:gap-2"
    >
      <UButton
        v-if="baseRace"
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

    <slot />
  </div>
</template>
