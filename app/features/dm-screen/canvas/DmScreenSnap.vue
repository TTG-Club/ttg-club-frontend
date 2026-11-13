<script setup lang="ts">
  import type { DmScreenPoint, DmScreenSnapTarget } from '../model';

  import { useDmScreen, useDmScreenSnap } from '../composables';
  import {
    DM_SCREEN_SNAP_LAYOUTS,
    DM_SCREEN_SNAP_PICKER_OFFSET,
    DM_SCREEN_SNAP_ZONE_CLASS,
    DM_SCREEN_SNAP_ZONE_SELECTOR,
    DM_SCREEN_TEXT,
    getDmScreenRectStyle,
    getDmScreenWindowIcon,
    getDmScreenZoneStyle,
  } from '../model';

  /**
   * Раскладки окон поверх холста. Пока окно тащат: подсветка места, которое
   * оно займёт, и у верха или низа холста — панель раскладок (где именно и
   * показывать ли её, выбирают в настройках в шапке ширмы). После того как окно
   * встало в раскладку: в следующем свободном месте — список окон, которые
   * можно туда поставить; Escape или клик мимо заканчивает подбор.
   *
   * Панель не ловит указатель (под ним окно, которое тащат), поэтому место
   * под указателем ищется по координатам.
   */
  const { viewport } = useDmScreen();

  const {
    pointer,
    target,
    pickerPosition,
    isPickerVisible,
    previewRect,
    assistRect,
    assistPendingRects,
    assistCandidates,
    setPickerTarget,
    place,
    skip,
    stopAssist,
  } = useDmScreenSnap();

  const picker = useTemplateRef<HTMLElement>('picker');

  /** Все места всех раскладок подряд: по номеру в этом списке их находят. */
  const pickerTargets = computed<Array<DmScreenSnapTarget>>(() =>
    DM_SCREEN_SNAP_LAYOUTS.flatMap((layout) =>
      layout.zones.map((zone) => ({ layout, zone })),
    ),
  );

  const pickerLayouts = computed(() =>
    DM_SCREEN_SNAP_LAYOUTS.map((layout) => ({
      key: layout.key,
      zones: layout.zones.map((zone) => ({
        index: pickerTargets.value.findIndex(
          (candidate) => candidate.zone === zone,
        ),
        style: getDmScreenZoneStyle(zone),
        class:
          target.value?.zone === zone
            ? DM_SCREEN_SNAP_ZONE_CLASS.active
            : DM_SCREEN_SNAP_ZONE_CLASS.idle,
      })),
    })),
  );

  const pickerStyle = computed(() =>
    pickerPosition.value === 'bottom'
      ? { bottom: `${DM_SCREEN_SNAP_PICKER_OFFSET}px` }
      : {
          top: `${(viewport.value.top ?? 0) + DM_SCREEN_SNAP_PICKER_OFFSET}px`,
        },
  );

  /**
   * Место панели раскладок, над которым находится точка.
   * @param point - где указатель
   */
  function findPickerTarget(
    point: DmScreenPoint,
  ): DmScreenSnapTarget | undefined {
    const zoneElements = picker.value?.querySelectorAll<HTMLElement>(
      DM_SCREEN_SNAP_ZONE_SELECTOR,
    );

    const hit = [...(zoneElements ?? [])].find((zoneElement) => {
      const bounds = zoneElement.getBoundingClientRect();

      return (
        point.x >= bounds.left
        && point.x <= bounds.right
        && point.y >= bounds.top
        && point.y <= bounds.bottom
      );
    });

    return hit ? pickerTargets.value[Number(hit.dataset.zone)] : undefined;
  }

  // После отрисовки: панель появляется от того же движения указателя
  watch(
    pointer,
    (point) => {
      setPickerTarget(point ? findPickerTarget(point) : undefined);
    },
    { flush: 'post' },
  );

  const previewStyle = computed(() =>
    previewRect.value ? getDmScreenRectStyle(previewRect.value) : undefined,
  );

  const assistStyle = computed(() =>
    assistRect.value ? getDmScreenRectStyle(assistRect.value) : undefined,
  );

  const assistPendingStyles = computed(() =>
    assistPendingRects.value.map((rect) => ({
      key: `${rect.x}:${rect.y}`,
      style: getDmScreenRectStyle(rect),
    })),
  );

  onKeyStroke('Escape', stopAssist);
</script>

<template>
  <div
    v-if="previewStyle"
    :style="previewStyle"
    class="pointer-events-none fixed rounded-lg border-2 border-primary bg-primary/15"
  />

  <div
    v-if="isPickerVisible"
    ref="picker"
    aria-hidden="true"
    :style="pickerStyle"
    class="pointer-events-none fixed left-[calc(50%+var(--navbar-width)/2)] grid w-max -translate-x-1/2 grid-cols-7 gap-2 rounded-xl border border-default bg-elevated p-2 shadow-xl"
  >
    <div
      v-for="layout in pickerLayouts"
      :key="layout.key"
      class="relative h-14 w-24"
    >
      <div
        v-for="zone in layout.zones"
        :key="zone.index"
        :data-zone="zone.index"
        :style="zone.style"
        class="absolute p-0.5"
      >
        <div
          class="size-full rounded-sm border"
          :class="zone.class"
        />
      </div>
    </div>
  </div>

  <!--
    Пока подбираются окна, клик мимо места заканчивает подбор. Окна, ещё
    не поставленные в раскладку, уходят на второй план сами
    (`DmScreenWindow`), а уже поставленные остаются чёткими.
  -->
  <div
    v-if="assistStyle"
    class="fixed inset-0 cursor-pointer"
    @click.left.exact.self.prevent.stop="stopAssist"
  />

  <div
    v-for="pending in assistPendingStyles"
    :key="pending.key"
    :style="pending.style"
    class="pointer-events-none fixed rounded-lg border-2 border-dashed border-accented"
  />

  <section
    v-if="assistStyle"
    role="dialog"
    aria-modal="false"
    :aria-label="DM_SCREEN_TEXT.snapAssistTitle"
    :style="assistStyle"
    class="fixed flex flex-col gap-2 overflow-y-auto rounded-lg border-2 border-dashed border-primary bg-default p-3 shadow-xl"
  >
    <h2 class="text-sm text-muted">
      {{ DM_SCREEN_TEXT.snapAssistTitle }}
    </h2>

    <UButton
      v-for="candidate in assistCandidates"
      :key="candidate.id"
      :icon="getDmScreenWindowIcon(candidate.path)"
      :label="candidate.title"
      color="neutral"
      variant="soft"
      class="justify-start"
      :ui="{ label: 'truncate', leadingIcon: 'text-primary' }"
      @click.left.exact.prevent="place(candidate.id)"
    />

    <div class="mt-auto flex justify-end gap-2 pt-2">
      <UButton
        :label="DM_SCREEN_TEXT.snapAssistSkip"
        color="neutral"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="skip"
      />

      <UButton
        :label="DM_SCREEN_TEXT.snapAssistStop"
        color="neutral"
        variant="outline"
        size="sm"
        @click.left.exact.prevent="stopAssist"
      />
    </div>
  </section>
</template>
