<script setup lang="ts">
  import { SectionLayout } from '~section/layout';
  import { AuthModal } from '~user/auth-modal';

  import { useTrackerList, useTrackerSlot } from '../composables';
  import {
    createTracker,
    getTrackerErrorMessage,
    getTrackerRoute,
    INITIATIVE_ICON,
    INITIATIVE_LIMIT,
    INITIATIVE_TEXT,
  } from '../model';
  import TrackerListRow from './TrackerListRow.vue';

  /**
   * Страница трекера: у пользователя — его бои и история, гостя сразу
   * отправляет в его единственный бой, а если боя нет — создаёт его.
   */
  const UNAUTHORIZED_STATUS = 401;

  const toast = useToast();
  const { isLoggedIn, pending } = useUser();
  const { slot, saveSlot } = useTrackerSlot();

  const {
    activeTrackers,
    deletedTrackers,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    rename,
    remove,
  } = useTrackerList();

  const isGuestCreating = ref(false);
  const isGuestFailed = ref(false);
  const isAuthOpen = ref(false);

  const isAuthError = computed(() => errorStatus.value === UNAUTHORIZED_STATUS);

  const errorTitle = computed(() =>
    isAuthError.value
      ? INITIATIVE_TEXT.authRequired
      : INITIATIVE_TEXT.loadFailed,
  );

  const countLabel = computed(
    () => `${activeTrackers.value.length} / ${INITIATIVE_LIMIT.trackers}`,
  );

  const isCreateDisabled = computed(() => isLoggedIn.value && !canCreate.value);

  const isCreating = computed(() => isMutating.value || isGuestCreating.value);

  /** Создаёт бой гостя, запоминает ключ и открывает бой. */
  async function openGuestTracker(): Promise<void> {
    isGuestCreating.value = true;
    isGuestFailed.value = false;

    try {
      const created = await createTracker();

      if (!created.accessKey) {
        throw new Error(INITIATIVE_TEXT.errorNoKey);
      }

      saveSlot(created.id, created.accessKey);
      await navigateTo(getTrackerRoute(created.id), { replace: true });
    } catch (error) {
      isGuestFailed.value = true;

      toast.add({
        title: getTrackerErrorMessage(INITIATIVE_TEXT.errorCreate, error),
        color: 'error',
      });
    } finally {
      isGuestCreating.value = false;
    }
  }

  async function createForUser(): Promise<void> {
    const created = await create();

    if (created) {
      await navigateTo(getTrackerRoute(created.id));
    }
  }

  function createTrackerClick(): void {
    if (isLoggedIn.value) {
      createForUser();
    } else {
      openGuestTracker();
    }
  }

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  /** Решает, что показать, когда стало известно, вошёл ли посетитель. */
  async function start(): Promise<void> {
    if (isLoggedIn.value) {
      await load();

      return;
    }

    if (slot.value) {
      await navigateTo(getTrackerRoute(slot.value.trackerId), {
        replace: true,
      });

      return;
    }

    await openGuestTracker();
  }

  onMounted(async () => {
    await until(pending).toBe(false);
    await start();
  });

  // Вошёл через окно входа — показываем его бои
  watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      load();
    }
  });
</script>

<template>
  <SectionLayout :title="INITIATIVE_TEXT.title">
    <template #controls>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          {{ INITIATIVE_TEXT.createDescription }}
        </p>

        <UButton
          :label="INITIATIVE_TEXT.create"
          :icon="INITIATIVE_ICON.create"
          :loading="isCreating"
          :disabled="isCreateDisabled"
          block
          @click.left.exact.prevent="createTrackerClick"
        />

        <p
          v-if="isCreateDisabled"
          class="text-sm text-warning"
        >
          {{ INITIATIVE_TEXT.limit }}
        </p>

        <p
          v-if="!isLoggedIn"
          class="text-sm text-muted"
        >
          {{ INITIATIVE_TEXT.guestHint }}
        </p>
      </div>
    </template>

    <div
      v-if="isLoggedIn"
      class="flex flex-col gap-4"
    >
      <template v-if="isLoading && !isLoaded">
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-16 w-full rounded-xl"
        />
      </template>

      <UEmpty
        v-else-if="errorStatus !== undefined"
        :icon="INITIATIVE_ICON.preparing"
        :title="errorTitle"
        variant="naked"
        class="py-16"
      >
        <template #actions>
          <UButton
            v-if="isAuthError"
            :label="INITIATIVE_TEXT.signIn"
            :icon="INITIATIVE_ICON.signIn"
            @click.left.exact.prevent="openAuth"
          />

          <UButton
            :label="INITIATIVE_TEXT.retry"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="load"
          />
        </template>
      </UEmpty>

      <template v-else>
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg text-highlighted">
            {{ INITIATIVE_TEXT.yourTrackers }}
          </h2>

          <span class="text-sm text-muted">{{ countLabel }}</span>
        </div>

        <div
          v-if="activeTrackers.length"
          class="flex flex-col gap-2"
        >
          <TrackerListRow
            v-for="tracker in activeTrackers"
            :key="tracker.id"
            :tracker="tracker"
            :is-disabled="isMutating"
            @rename="rename"
            @remove="remove"
          />
        </div>

        <UEmpty
          v-else
          :icon="INITIATIVE_ICON.preparing"
          :title="INITIATIVE_TEXT.empty"
          variant="naked"
          class="py-12"
        />

        <UCollapsible
          v-if="deletedTrackers.length"
          class="flex flex-col gap-2"
        >
          <UButton
            :label="INITIATIVE_TEXT.history"
            :icon="INITIATIVE_ICON.history"
            color="neutral"
            variant="ghost"
            class="self-start"
          />

          <template #content>
            <div class="flex flex-col gap-2">
              <TrackerListRow
                v-for="tracker in deletedTrackers"
                :key="tracker.id"
                :tracker="tracker"
              />
            </div>
          </template>
        </UCollapsible>
      </template>
    </div>

    <UEmpty
      v-else-if="isGuestFailed"
      :icon="INITIATIVE_ICON.preparing"
      :title="INITIATIVE_TEXT.guestFailed"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="INITIATIVE_TEXT.create"
          :icon="INITIATIVE_ICON.create"
          :loading="isGuestCreating"
          @click.left.exact.prevent="openGuestTracker"
        />
      </template>
    </UEmpty>

    <div
      v-else
      class="flex items-center justify-center gap-2 py-16 text-muted"
    >
      <UIcon
        :name="INITIATIVE_ICON.loading"
        class="size-5 animate-spin"
      />

      {{ INITIATIVE_TEXT.guestLoading }}
    </div>

    <AuthModal v-model="isAuthOpen" />
  </SectionLayout>
</template>
