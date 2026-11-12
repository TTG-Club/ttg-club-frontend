<script setup lang="ts">
  import { getRoleLabels } from '../model';

  /**
   * Шапка личного кабинета, как на new.ttg.club: круглая аватарка с
   * инициалами, имя и роли.
   */
  const { user, roles } = useUser();

  // Без отображаемого имени на сайте показывается логин
  const shownName = computed(
    () => user.value?.displayName || user.value?.username || '',
  );

  const roleLabels = computed(() => getRoleLabels(roles.value));
</script>

<template>
  <div class="flex flex-col items-center pt-6 text-center">
    <div class="relative mb-6 rounded-full">
      <span class="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />

      <UAvatar
        :alt="shownName"
        size="3xl"
        class="relative z-10 size-32 text-4xl shadow-2xl ring-4 ring-default"
      />
    </div>

    <h2 class="mb-2 max-w-full text-3xl font-bold tracking-tight text-primary">
      <span class="block truncate">{{ shownName }}</span>
    </h2>

    <div class="flex flex-wrap items-center justify-center gap-2">
      <UBadge
        v-for="label in roleLabels"
        :key="label"
        :label="label"
        color="primary"
        variant="subtle"
        size="md"
      />
    </div>
  </div>
</template>
