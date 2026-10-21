<script setup lang="ts">
  import { MENU_SKELETON_LINKS } from '../model';
</script>

<template>
  <section
    v-for="(count, index) in MENU_SKELETON_LINKS"
    :key="index"
    class="break-inside-avoid pb-6"
  >
    <div class="mb-2 flex items-center justify-between gap-2 px-2.5">
      <USkeleton class="h-4 w-28" />

      <USkeleton class="size-5 rounded-full" />
    </div>

    <ul class="flex flex-col gap-0.5">
      <li
        v-for="link in count"
        :key="link"
        class="px-2.5 py-1.5"
      >
        <USkeleton class="h-5 w-4/5" />
      </li>
    </ul>
  </section>
</template>
