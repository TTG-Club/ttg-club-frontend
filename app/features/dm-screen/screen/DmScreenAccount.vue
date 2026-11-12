<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { getApiErrorMessage } from '~user/model';

  import { DmScreenCanvas } from '../canvas';
  import { useDmScreen } from '../composables';
  import { DmScreenNameModal } from '../dialogs';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_PATH,
    DM_SCREEN_TEXT,
    fetchDmScreen,
    renameDmScreen,
  } from '../model';

  /**
   * Ширма из аккаунта по её идентификатору: загружается с сервера и
   * подключается к окнам, изменения сохраняются сами. В шапке — путь к
   * списку ширм и имя ширмы с переименованием.
   */
  const { id } = defineProps<{
    id: string;
  }>();

  const toast = useToast();
  const { attach, detach, saveOnLeave } = useDmScreen();

  const name = ref('');
  const isLoading = ref(true);
  const isFailed = ref(false);
  const isRenameOpen = ref(false);

  async function load(): Promise<void> {
    isLoading.value = true;
    isFailed.value = false;

    try {
      const screen = await fetchDmScreen(id);

      name.value = screen.name;
      attach(screen.id, screen.windows);
    } catch {
      isFailed.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  const failedActions = computed<Array<ButtonProps>>(() => [
    { label: DM_SCREEN_TEXT.retry, onClick: load },
    {
      label: DM_SCREEN_TEXT.allScreens,
      to: DM_SCREEN_PATH,
      color: 'neutral',
      variant: 'outline',
    },
  ]);

  onMounted(load);

  onBeforeUnmount(detach);

  // Закрытие вкладки или уход в фон: сохранить, пока браузер не оборвал
  useEventListener('pagehide', saveOnLeave);

  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveOnLeave();
    }
  });

  function openRename(): void {
    isRenameOpen.value = true;
  }

  /**
   * Переименовывает ширму.
   * @param next - новое имя
   */
  async function rename(next: string): Promise<void> {
    try {
      name.value = (await renameDmScreen(id, next)).name;
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, DM_SCREEN_TEXT.errorRename),
        color: 'error',
      });
    }
  }
</script>

<template>
  <div
    v-if="isLoading"
    class="flex flex-col gap-3 p-4"
  >
    <USkeleton class="h-9 w-64" />

    <USkeleton class="h-64 w-full max-w-xl" />
  </div>

  <UEmpty
    v-else-if="isFailed"
    :icon="DM_SCREEN_ICON.screen"
    :title="DM_SCREEN_TEXT.screenLoadFailed"
    :actions="failedActions"
    class="m-auto min-h-dvh"
  />

  <DmScreenCanvas v-else>
    <template #heading>
      <div class="flex min-w-0 items-center gap-1">
        <UTooltip :text="DM_SCREEN_TEXT.allScreens">
          <UButton
            :to="DM_SCREEN_PATH"
            :icon="DM_SCREEN_ICON.back"
            :aria-label="DM_SCREEN_TEXT.allScreens"
            color="neutral"
            variant="ghost"
          />
        </UTooltip>

        <h1 class="truncate text-2xl text-highlighted">
          {{ name }}
        </h1>

        <UTooltip :text="DM_SCREEN_TEXT.rename">
          <UButton
            :icon="DM_SCREEN_ICON.rename"
            :aria-label="DM_SCREEN_TEXT.rename"
            color="neutral"
            variant="ghost"
            size="sm"
            @click.left.exact.prevent="openRename"
          />
        </UTooltip>
      </div>
    </template>
  </DmScreenCanvas>

  <DmScreenNameModal
    v-model:open="isRenameOpen"
    :title="DM_SCREEN_TEXT.renameTitle"
    :name="name"
    @save="rename"
  />
</template>
