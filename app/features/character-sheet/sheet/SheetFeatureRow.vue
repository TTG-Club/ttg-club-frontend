<script setup lang="ts">
  import type { ContentDescription } from '~content/model';

  import type { FeatureOrigin } from '../model';

  import { ContentRender } from '~content/render';

  import { useCharacterSheet } from '../composables';
  import {
    FEATURE_ORIGIN_COLORS,
    FEATURE_ORIGIN_LABELS,
    FEATURES_TEXT,
    SHEET_ICON,
    SHEET_ROW_ACTIONS_CLASS,
  } from '../model';

  /**
   * Строка особенности, как на new.ttg.club: бейдж источника, название,
   * выбор мелким шрифтом, значки увеличений и несделанных выборов; правка
   * и удаление проявляются по наведению. Раскрытие показывает источник,
   * выбор, выборы механики (слот) и описание.
   */
  const {
    name,
    origin,
    sourceLabel,
    choice = '',
    increases = '',
    pending = 0,
    url = null,
    description = null,
    canEdit = false,
    canRemove = false,
  } = defineProps<{
    name: string;
    origin: FeatureOrigin;
    /** Название источника: класс с уровнем, раса, предыстория. */
    sourceLabel: string;
    choice?: string;
    /** Увеличения характеристик: «СИЛ +1, ЛОВ +1». */
    increases?: string;
    /** Несделанные выборы механики. */
    pending?: number;
    /** Адрес записи справочника. */
    url?: string | null;
    description?: ContentDescription | null;
    canEdit?: boolean;
    canRemove?: boolean;
  }>();

  const emit = defineEmits<{
    edit: [];
    remove: [];
  }>();

  const slots = defineSlots<{
    default?: () => unknown;
  }>();

  const { editControlClass } = useCharacterSheet();

  const isExpanded = ref(false);

  const originLabel = computed(() => FEATURE_ORIGIN_LABELS[origin].label);
  const originColor = computed(() => FEATURE_ORIGIN_COLORS[origin]);

  const hasDescription = computed(() =>
    Array.isArray(description)
      ? description.length > 0
      : Boolean(description?.trim()),
  );

  const chevronClass = computed(() => (isExpanded.value ? 'rotate-180' : ''));

  function toggle(): void {
    isExpanded.value = !isExpanded.value;
  }

  function edit(): void {
    emit('edit');
  }

  function remove(): void {
    emit('remove');
  }
</script>

<template>
  <div
    class="group flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
  >
    <div class="relative flex items-center gap-2 p-3">
      <button
        type="button"
        class="flex min-w-0 grow cursor-pointer items-center gap-2 text-left after:absolute after:inset-0"
        :aria-expanded="isExpanded"
        @click.left.exact.prevent="toggle"
      >
        <UBadge
          :label="originLabel"
          :color="originColor"
          variant="subtle"
          size="sm"
          class="shrink-0"
        />

        <span class="truncate text-sm font-medium text-highlighted">
          {{ name }}
        </span>

        <span
          v-if="choice"
          class="max-w-1/2 truncate text-xs text-dimmed"
        >
          {{ choice }}
        </span>
      </button>

      <div class="relative z-10 flex shrink-0 items-center gap-1">
        <UBadge
          v-if="increases"
          :label="increases"
          color="primary"
          variant="subtle"
          size="sm"
        />

        <UTooltip
          v-if="pending"
          :text="FEATURES_TEXT.pending"
        >
          <UBadge
            :label="String(pending)"
            color="warning"
            variant="subtle"
            size="sm"
          />
        </UTooltip>

        <div
          class="flex items-center gap-1"
          :class="SHEET_ROW_ACTIONS_CLASS"
        >
          <UButton
            v-if="url"
            :to="url"
            target="_blank"
            :icon="SHEET_ICON.link"
            :aria-label="`${FEATURES_TEXT.open}: ${name}`"
            color="neutral"
            variant="ghost"
            size="xs"
          />

          <UButton
            v-if="canEdit"
            :icon="SHEET_ICON.edit"
            :aria-label="`${FEATURES_TEXT.edit}: ${name}`"
            color="neutral"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="edit"
          />

          <UButton
            v-if="canRemove"
            :icon="SHEET_ICON.remove"
            :aria-label="`${FEATURES_TEXT.remove}: ${name}`"
            color="error"
            variant="ghost"
            size="xs"
            :class="editControlClass"
            @click.left.exact.prevent="remove"
          />
        </div>

        <UIcon
          name="tabler:chevron-down"
          class="size-4 shrink-0 text-muted transition-transform"
          :class="chevronClass"
        />
      </div>
    </div>

    <div
      v-if="isExpanded"
      class="flex flex-col gap-2 border-t border-default/50 px-3 py-2 text-sm"
    >
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span
          v-if="sourceLabel"
          class="flex items-baseline gap-1"
        >
          <span class="text-muted">{{ FEATURES_TEXT.source }}:</span>

          <span class="text-toned">{{ sourceLabel }}</span>
        </span>

        <span
          v-if="choice"
          class="flex items-baseline gap-1"
        >
          <span class="text-muted">{{ FEATURES_TEXT.choice }}:</span>

          <span class="text-toned">{{ choice }}</span>
        </span>
      </div>

      <slot v-if="slots.default" />

      <ContentRender
        v-if="hasDescription"
        :content="description"
      />

      <span
        v-else-if="!slots.default"
        class="text-xs text-dimmed"
      >
        {{ FEATURES_TEXT.noDescription }}
      </span>
    </div>
  </div>
</template>
