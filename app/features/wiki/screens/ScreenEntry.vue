<script setup lang="ts">
  import type { ScreenDetail, ScreenWindowRequest } from '../model';

  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';

  import { useScreenWindows } from '../composables';
  import { screenDetailSchema, SCREENS_SECTION } from '../model';
  import ScreenBody from './ScreenBody.vue';
  import ScreenChildPane from './ScreenChildPane.vue';
  import ScreenGroups from './ScreenGroups.vue';

  /**
   * Запись поверх списка раздела; без адреса — страница записи по адресу
   * страницы. Вложенный раздел открывается своим окном поверх сайта, а где
   * окон нет (телефон) — на месте корневого: корневой прячется, но остаётся
   * смонтированным, чтобы возврат был мгновенным.
   */
  const { path = undefined } = defineProps<{
    path?: string;
  }>();

  const { isAvailable: isWindowAvailable, open: openWindow } =
    useScreenWindows();

  const childPath = ref<string>();

  const parentTitle = ref('');

  const root = useTemplateRef<HTMLElement>('root');

  /**
   * Открывает вложенный раздел окном или вместо корневого.
   * @param request - раздел, название и точка клика
   * @param parent - корневой раздел, к которому ведёт возврат
   */
  function openChild(request: ScreenWindowRequest, parent: ScreenDetail): void {
    if (isWindowAvailable.value) {
      openWindow(request);

      return;
    }

    parentTitle.value = parent.name.rus;
    childPath.value = request.path;
  }

  /** Возвращает к корневому разделу и показывает карточку, с которой ушли. */
  async function back(): Promise<void> {
    const openedPath = childPath.value;

    childPath.value = undefined;

    await nextTick();

    if (openedPath) {
      root.value
        ?.querySelector(`a[href="${CSS.escape(openedPath)}"]`)
        ?.scrollIntoView({ block: 'center' });
    }
  }
</script>

<template>
  <div ref="root">
    <ScreenChildPane
      v-if="childPath"
      v-model:path="childPath"
      :parent-title="parentTitle"
      @back="back"
    />

    <div v-show="!childPath">
      <SectionEntry
        :path="path"
        :section="SCREENS_SECTION"
        :schema="screenDetailSchema"
        :get-edit-path="getWorkshopEditPath"
      >
        <template #default="{ entry }">
          <ScreenGroups
            v-if="entry.chields?.length"
            :screen="entry"
            @open="(request) => openChild(request, entry)"
          />

          <ScreenBody
            v-else
            :screen="entry"
          />
        </template>
      </SectionEntry>
    </div>
  </div>
</template>
