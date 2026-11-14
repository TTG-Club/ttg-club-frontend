<script setup lang="ts">
  import type { FilterGroup, SourceEntry } from '../../model';

  import { xor } from 'es-toolkit';

  import { SECTION_ICON, SECTION_TEXT, setSourcesSelected } from '../../model';
  import SectionSourceCover from './SectionSourceCover.vue';

  /**
   * Группа источников, как на new.ttg.club: сворачиваемая шапка со счётчиком
   * и «Выбрать все», под ней книги строками — русское и английское название
   * и сокращение.
   */
  const {
    group,
    entries,
    selected,
    isOpenByDefault = true,
    isExpanded = false,
  } = defineProps<{
    group: FilterGroup;
    /** Показанные книги: под поиском их меньше, чем в группе. */
    entries: Array<SourceEntry>;
    /** Выбранные ключи группы. */
    selected: Array<string>;
    /** Раскрыта ли группа при появлении; дальше её открывает пользователь. */
    isOpenByDefault?: boolean;
    /** Держит группу раскрытой, пока идёт поиск. */
    isExpanded?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selected': [keys: Array<string>];
  }>();

  const isOpenedByUser = ref(isOpenByDefault);

  const isOpened = computed(() => isExpanded || isOpenedByUser.value);

  const chevronClass = computed(() =>
    isOpened.value ? 'rotate-90' : undefined,
  );

  /** Сворачивает или раскрывает группу. */
  function toggleOpened(): void {
    isOpenedByUser.value = !isOpened.value;
  }

  // Счётчик — по всей группе, а не по найденному: он про выдачу списка
  const counter = computed(
    () => `${selected.length} ${SECTION_TEXT.sourcesOf} ${group.values.length}`,
  );

  const counterColor = computed(() =>
    selected.length ? 'primary' : 'neutral',
  );

  const visibleKeys = computed(() => entries.map((entry) => entry.key));

  const visibleSelectedCount = computed(
    () => entries.filter((entry) => entry.selected).length,
  );

  /** «Выбрать все» по показанным книгам; часть выбранных — чёрточка. */
  const selectAllState = computed<boolean | 'indeterminate'>(() => {
    if (!visibleSelectedCount.value) {
      return false;
    }

    return visibleSelectedCount.value === entries.length || 'indeterminate';
  });

  /**
   * Отмечает или снимает все показанные книги группы.
   * @param state - новое состояние «Выбрать все»
   */
  function setAll(state: boolean | 'indeterminate'): void {
    emit(
      'update:selected',
      setSourcesSelected(selected, visibleKeys.value, state === true),
    );
  }

  /**
   * Отмечает книгу или снимает отметку.
   * @param key - ключ книги
   */
  function toggle(key: string): void {
    emit('update:selected', xor(selected, [key]));
  }
</script>

<template>
  <section class="flex flex-col gap-1">
    <div class="flex items-center gap-3">
      <UButton
        color="neutral"
        variant="link"
        :icon="SECTION_ICON.groupToggle"
        class="min-w-0 grow px-0 text-default hover:text-highlighted"
        :ui="{
          leadingIcon: ['transition-transform duration-200', chevronClass],
        }"
        :aria-expanded="isOpened"
        @click.left.exact.prevent="toggleOpened"
      >
        <span class="min-w-0 truncate text-left font-semibold">
          {{ group.name }}
        </span>

        <UBadge
          :label="counter"
          :color="counterColor"
          variant="subtle"
          size="sm"
          class="shrink-0"
        />

        <span class="min-w-3 grow border-t border-default" />
      </UButton>

      <UCheckbox
        :model-value="selectAllState"
        :label="SECTION_TEXT.selectAll"
        size="md"
        class="shrink-0"
        @update:model-value="setAll"
      />
    </div>

    <div
      v-if="isOpened"
      class="flex flex-col gap-0.5"
    >
      <!-- Строка — галочка без квадратика: выбор видно по обложке и яркости -->
      <!-- названия, а сама галочка остаётся для клавиатуры и скринридеров. -->
      <UCheckbox
        v-for="entry in entries"
        :key="entry.key"
        :model-value="entry.selected"
        variant="card"
        indicator="hidden"
        size="md"
        :ui="{
          root: 'group items-start rounded-md border-0 px-2 py-1.5 hover:bg-accented/50 has-focus-visible:ring has-focus-visible:ring-accented has-data-[state=checked]:bg-transparent has-data-[state=checked]:hover:bg-accented/50',
          wrapper: 'block min-w-0 grow text-left',
          label: 'block',
        }"
        @update:model-value="toggle(entry.key)"
      >
        <template #label>
          <span class="flex items-start gap-3">
            <SectionSourceCover :is-selected="entry.selected" />

            <span class="flex min-w-0 grow flex-col">
              <span
                class="min-w-0 wrap-break-word text-muted group-has-data-[state=checked]:text-highlighted"
              >
                {{ entry.name }}
              </span>

              <span
                v-if="entry.english"
                class="min-w-0 text-sm font-normal wrap-break-word text-dimmed group-has-data-[state=checked]:text-muted"
              >
                {{ entry.english }}
              </span>
            </span>

            <UBadge
              v-if="entry.acronym"
              :label="entry.acronym"
              :color="entry.selected ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
              class="min-w-14 shrink-0 justify-center font-mono"
            />
          </span>
        </template>
      </UCheckbox>
    </div>
  </section>
</template>
