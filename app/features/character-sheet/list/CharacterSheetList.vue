<script setup lang="ts">
  import type { CharacterSheet } from '../model';

  import { SectionLayout } from '~section/layout';
  import { ToolResultGrid } from '~tools/generator';
  import { AuthModal } from '~user/auth-modal';

  import { useSheetList } from '../composables';
  import { SheetConfirmModal } from '../dialogs';
  import {
    CHARACTER_SHEET_ICON,
    getSheetRoute,
    SHEET_HTTP_STATUS,
    SHEET_ICON,
    SHEET_TEXT,
  } from '../model';
  import SheetListCard from './SheetListCard.vue';

  /**
   * Страница листов персонажей: у пользователя — его листы, гостю —
   * приглашение войти. Листы хранятся только в аккаунте.
   */
  const { isLoggedIn, pending } = useUser();

  const {
    sheets,
    limit,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    copy,
    remove,
  } = useSheetList();

  const isAuthOpen = ref(false);
  const removedSheet = ref<CharacterSheet | null>(null);
  const isRemoveOpen = ref(false);

  const isAuthError = computed(
    () => errorStatus.value === SHEET_HTTP_STATUS.unauthorized,
  );

  const countLabel = computed(() => `${sheets.value.length} / ${limit.value}`);

  const isCreateDisabled = computed(() => isLoggedIn.value && !canCreate.value);

  async function createSheet(): Promise<void> {
    if (!isLoggedIn.value) {
      openAuth();

      return;
    }

    const created = await create();

    if (created) {
      await navigateTo(getSheetRoute(created.id));
    }
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param sheet - удаляемый лист
   */
  function askRemove(sheet: CharacterSheet): void {
    removedSheet.value = sheet;
    isRemoveOpen.value = true;
  }

  async function confirmRemove(): Promise<void> {
    if (removedSheet.value) {
      await remove(removedSheet.value.id);
      removedSheet.value = null;
    }
  }

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // Вошёл через окно входа — показываем его листы. Сессия известна только
  // после загрузки профиля, поэтому ждём её
  watch(
    [isLoggedIn, pending],
    ([loggedIn, isPending]) => {
      if (loggedIn && !isPending) {
        load();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <SectionLayout
    :title="SHEET_TEXT.listTitle"
    is-full-width
  >
    <template #controls>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          {{ SHEET_TEXT.listDescription }}
        </p>

        <UButton
          :label="SHEET_TEXT.create"
          :icon="SHEET_ICON.add"
          :loading="isMutating"
          :disabled="isCreateDisabled"
          block
          @click.left.exact.prevent="createSheet"
        />

        <p
          v-if="isCreateDisabled"
          class="text-sm text-warning"
        >
          {{ SHEET_TEXT.limit }}
        </p>
      </div>
    </template>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        :name="SHEET_ICON.loading"
        class="size-6 animate-spin text-muted"
      />
    </div>

    <UEmpty
      v-else-if="!isLoggedIn || isAuthError"
      :icon="CHARACTER_SHEET_ICON"
      :title="SHEET_TEXT.authRequired"
      :description="SHEET_TEXT.authDescription"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.signIn"
          :icon="SHEET_ICON.user"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <div
      v-else
      class="flex flex-col gap-4"
    >
      <ToolResultGrid v-if="isLoading && !isLoaded">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-18 w-full rounded-xl"
        />
      </ToolResultGrid>

      <UEmpty
        v-else-if="errorStatus !== undefined"
        :icon="SHEET_ICON.empty"
        :title="SHEET_TEXT.loadFailed"
        variant="naked"
        class="py-16"
      >
        <template #actions>
          <UButton
            :label="SHEET_TEXT.retry"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="load"
          />
        </template>
      </UEmpty>

      <template v-else>
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg text-highlighted">
            {{ SHEET_TEXT.listTitle }}
          </h2>

          <span class="text-sm text-muted">{{ countLabel }}</span>
        </div>

        <ToolResultGrid v-if="sheets.length">
          <SheetListCard
            v-for="sheet in sheets"
            :key="sheet.id"
            :sheet="sheet"
            :is-disabled="isMutating"
            @copy="copy"
            @remove="askRemove"
          />
        </ToolResultGrid>

        <UEmpty
          v-else
          :icon="CHARACTER_SHEET_ICON"
          :title="SHEET_TEXT.empty"
          variant="naked"
          class="py-12"
        />
      </template>
    </div>

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="SHEET_TEXT.removeTitle"
      :description="SHEET_TEXT.removeDescription"
      @confirm="confirmRemove"
    />

    <AuthModal v-model="isAuthOpen" />
  </SectionLayout>
</template>
