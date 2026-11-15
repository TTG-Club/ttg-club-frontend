<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { useDmScreen } from '../composables';
  import {
    createDmScreen,
    DM_SCREEN_DEFAULT_NAME,
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    fetchDmScreenList,
  } from '../model';
  import DmScreenAccount from './DmScreenAccount.vue';

  /**
   * Ширма пользователя: она у него одна, поэтому открывается сразу, без
   * списка. Если ширмы ещё нет, она создаётся сама — и забирает окна,
   * которые гость собрал в этом браузере до входа.
   */
  const { localWindows, clearLocal, cachedScreen } = useDmScreen();

  // Ширма из копии в браузере открывается сразу; список с сервера следом
  // подтверждает её или подменяет, если ширма у пользователя уже другая
  const id = ref(cachedScreen.value?.id ?? '');
  const isFailed = ref(false);

  /** Находит ширму пользователя, а если её нет — создаёт. */
  async function load(): Promise<void> {
    isFailed.value = false;

    try {
      const [existing] = (await fetchDmScreenList()).items;

      if (existing) {
        id.value = existing.id;

        return;
      }

      const created = await createDmScreen(DM_SCREEN_DEFAULT_NAME, [
        ...localWindows.value,
      ]);

      clearLocal();
      id.value = created.id;
    } catch {
      // Ширма, открытая с копии, о сбое загрузки сообщит сама
      isFailed.value = !id.value;
    }
  }

  const failedActions = computed<Array<ButtonProps>>(() => [
    { label: DM_SCREEN_TEXT.retry, onClick: load },
  ]);

  onMounted(load);
</script>

<template>
  <UEmpty
    v-if="isFailed"
    :icon="DM_SCREEN_ICON.screen"
    :title="DM_SCREEN_TEXT.screenLoadFailed"
    :actions="failedActions"
    class="m-auto min-h-dvh"
  />

  <DmScreenAccount
    v-else-if="id"
    :id="id"
    :key="id"
  />

  <div
    v-else
    class="flex flex-col gap-3 p-4"
  >
    <USkeleton class="h-9 w-64" />

    <USkeleton class="h-64 w-full max-w-xl" />
  </div>
</template>
