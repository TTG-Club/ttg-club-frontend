<script setup lang="ts">
  import { z } from 'zod';

  import { entryNameSchema, getSectionEntryKey } from '~section/model';

  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    resolveDmScreenSection,
  } from '../model';
  import { DM_SCREEN_ENTRIES } from './entries';

  /** Из загруженной записи окну нужно только название. */
  const loadedNameSchema = z.object({ name: entryNameSchema });

  /**
   * Запись любого раздела в окне ширмы: карточка выбирается по адресу.
   * Адрес раздела, которого ширма не знает, показывает пустое состояние.
   * Когда запись загрузится, окно узнаёт её название: при переходе внутри
   * окна (вкладка класса, подраса) шапка не отстаёт от записи.
   */
  const { path } = defineProps<{
    /** Адрес записи; при смене адреса компонент создаётся заново. */
    path: string;
  }>();

  const emit = defineEmits<{
    loaded: [title: string];
  }>();

  const section = resolveDmScreenSection(path);

  const entryComponent = section ? DM_SCREEN_ENTRIES[section.path] : undefined;

  // Ключ не реактивный, поэтому адрес у компонента постоянный
  const { data: loadedEntry } = useNuxtData(
    getSectionEntryKey(section?.key ?? '', path),
  );

  watchImmediate(loadedEntry, (value) => {
    const parsed = loadedNameSchema.safeParse(value);

    if (parsed.success) {
      emit('loaded', parsed.data.name.rus);
    }
  });
</script>

<template>
  <Suspense v-if="entryComponent">
    <component
      :is="entryComponent"
      :path="path"
    />

    <template #fallback>
      <div class="flex flex-col gap-2 pt-4">
        <USkeleton class="h-8 w-2/3" />

        <USkeleton
          v-for="index in 6"
          :key="index"
          class="h-4 w-full"
        />
      </div>
    </template>
  </Suspense>

  <UEmpty
    v-else
    :icon="DM_SCREEN_ICON.unknown"
    :title="DM_SCREEN_TEXT.unknownEntry"
    class="pt-4"
  />
</template>
