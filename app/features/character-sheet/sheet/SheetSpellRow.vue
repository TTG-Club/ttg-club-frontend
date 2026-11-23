<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SheetSpell, SpellDamageTile, SpellOrigin } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    SHEET_ACCENT_STAT_CLASSES,
    SHEET_ICON,
    SHEET_ITEM_STAT_LAYOUT_CLASS,
    SHEET_ROLL_STAT_CLASS,
    SPELL_ICON,
    SPELL_ICON_CLASS,
    SPELL_STAT_KEYS,
    SPELL_STAT_LABELS,
    SPELL_TAB_TEXT,
  } from '../model';

  /**
   * Строка заклинания, как на new.ttg.club: квадрат со значком — переключатель
   * подготовки, название со школой и значками (своя характеристика, класс,
   * свой, концентрация, ритуал), плитки урона и лечения и меню действий.
   * Клик по заклинанию справочника открывает описание, своё —
   * разворачивается на месте.
   */
  const {
    spell,
    origin,
    isPrepared,
    isToggleable,
    toggleHint,
    tiles,
    abilityLabel,
  } = defineProps<{
    spell: SheetSpell;
    origin: SpellOrigin;
    /** Подготовлено с учётом «всегда». */
    isPrepared: boolean;
    /** Квадрат переключает подготовку; у выданного заговора — нет. */
    isToggleable: boolean;
    toggleHint: string;
    tiles: ReadonlyArray<SpellDamageTile>;
    /** Своя характеристика заклинания; null — как у класса. */
    abilityLabel: string | null;
  }>();

  const emit = defineEmits<{
    'toggle-prepared': [];
    'preview': [];
    'roll': [tile: SpellDamageTile];
    'cast': [];
    'edit': [];
    'copy': [];
    'ability': [];
    'remove': [];
  }>();

  const { editControlClass } = useCharacterSheet();

  const isExpanded = ref(false);

  const isCustom = computed(() => !spell.url);

  const iconClass = computed(() => [
    SPELL_ICON_CLASS.base,
    isPrepared ? SPELL_ICON_CLASS.prepared : SPELL_ICON_CLASS.idle,
    isToggleable ? 'cursor-pointer' : 'cursor-default',
  ]);

  const tileViews = computed(() =>
    tiles.map((tile) => {
      const label = tile.isHealing
        ? SPELL_TAB_TEXT.healing
        : SPELL_TAB_TEXT.damage;

      const hint = [
        tile.formula,
        tile.isHealing ? '' : tile.typeLabel,
        tile.conditionLabel,
        spell.level > 0 ? SPELL_TAB_TEXT.castHint : SPELL_TAB_TEXT.rollHint,
      ]
        .filter(Boolean)
        .join(' · ');

      return { tile, label, hint };
    }),
  );

  const statRows = computed(() =>
    SPELL_STAT_KEYS.flatMap((key) =>
      spell[key].trim()
        ? [{ key, label: SPELL_STAT_LABELS[key], value: spell[key] }]
        : [],
    ),
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    ...(spell.level > 0
      ? [
          {
            label: SPELL_TAB_TEXT.cast,
            icon: SPELL_ICON,
            onSelect: () => emit('cast'),
          },
        ]
      : []),
    isCustom.value
      ? {
          label: SPELL_TAB_TEXT.edit,
          icon: SHEET_ICON.edit,
          onSelect: () => emit('edit'),
        }
      : {
          label: SPELL_TAB_TEXT.copy,
          icon: SHEET_ICON.copy,
          onSelect: () => emit('copy'),
        },
    {
      label: SPELL_TAB_TEXT.ability,
      icon: 'tabler:brain',
      onSelect: () => emit('ability'),
    },
    {
      label: SPELL_TAB_TEXT.remove,
      icon: SHEET_ICON.remove,
      color: 'error',
      onSelect: () => emit('remove'),
    },
  ]);

  const openLabel = computed(
    () =>
      `${isCustom.value ? SPELL_TAB_TEXT.expand : SPELL_TAB_TEXT.open}: ${spell.name}`,
  );

  const chevronClass = computed(() => (isExpanded.value ? 'rotate-180' : ''));

  function open(): void {
    if (isCustom.value) {
      isExpanded.value = !isExpanded.value;

      return;
    }

    emit('preview');
  }

  function togglePrepared(): void {
    emit('toggle-prepared');
  }

  /**
   * Нажатие на плитку урона.
   * @param tile - плитка
   */
  function roll(tile: SpellDamageTile): void {
    emit('roll', tile);
  }
</script>

<template>
  <div
    class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
  >
    <div class="@container relative flex items-center gap-3 p-2 sm:p-3">
      <UTooltip :text="toggleHint">
        <button
          v-if="isToggleable"
          type="button"
          :class="iconClass"
          :aria-pressed="isPrepared"
          :aria-label="`${toggleHint}: ${spell.name}`"
          @click.left.exact.prevent="togglePrepared"
        >
          <UIcon
            :name="SPELL_ICON"
            class="size-5"
          />
        </button>

        <span
          v-else
          :class="iconClass"
          :aria-label="`${toggleHint}: ${spell.name}`"
        >
          <UIcon
            :name="SPELL_ICON"
            class="size-5"
          />
        </span>
      </UTooltip>

      <button
        type="button"
        class="flex min-w-0 grow cursor-pointer flex-col text-left after:absolute after:inset-0"
        :aria-label="openLabel"
        :aria-expanded="isCustom ? isExpanded : undefined"
        @click.left.exact.prevent="open"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate text-sm font-medium text-highlighted">
            {{ spell.name }}
          </span>

          <UTooltip
            v-if="abilityLabel"
            :text="SPELL_TAB_TEXT.abilityHint"
          >
            <UBadge
              :label="abilityLabel"
              :icon="SPELL_ICON"
              color="secondary"
              variant="subtle"
              size="sm"
              class="relative z-10 shrink-0"
            />
          </UTooltip>
        </span>

        <span
          v-if="spell.school"
          class="truncate text-xs text-dimmed"
        >
          {{ spell.school }}
        </span>
      </button>

      <div
        v-if="tileViews.length"
        class="relative z-10 flex shrink-0 items-center gap-1.5"
      >
        <UTooltip
          v-for="view in tileViews"
          :key="view.tile.key"
          :text="view.hint"
        >
          <button
            type="button"
            class="transition-colors"
            :class="[
              SHEET_ITEM_STAT_LAYOUT_CLASS,
              SHEET_ACCENT_STAT_CLASSES.container,
              SHEET_ROLL_STAT_CLASS,
            ]"
            :aria-label="`${view.label}: ${spell.name}`"
            @click.left.exact.prevent="roll(view.tile)"
          >
            <span
              class="text-xs font-bold"
              :class="SHEET_ACCENT_STAT_CLASSES.value"
            >
              {{ view.tile.formula }}
            </span>

            <span
              class="text-[9px] uppercase"
              :class="SHEET_ACCENT_STAT_CLASSES.label"
            >
              {{ view.label }}
            </span>
          </button>
        </UTooltip>
      </div>

      <div class="relative z-10 flex shrink-0 items-center gap-1">
        <UTooltip
          v-if="origin === 'class'"
          :text="SPELL_TAB_TEXT.classBadgeHint"
        >
          <UBadge
            :label="SPELL_TAB_TEXT.classBadge"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </UTooltip>

        <UTooltip
          v-if="isCustom"
          :text="SPELL_TAB_TEXT.customHint"
        >
          <UBadge
            :label="SPELL_TAB_TEXT.custom"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </UTooltip>

        <UTooltip
          v-if="spell.isConcentration"
          :text="SPELL_TAB_TEXT.concentration"
        >
          <UBadge
            :label="SPELL_TAB_TEXT.concentrationShort"
            color="primary"
            variant="subtle"
            size="sm"
          />
        </UTooltip>

        <UTooltip
          v-if="spell.isRitual"
          :text="SPELL_TAB_TEXT.ritual"
        >
          <UBadge
            :label="SPELL_TAB_TEXT.ritualShort"
            color="info"
            variant="subtle"
            size="sm"
          />
        </UTooltip>

        <UDropdownMenu
          :items="menuItems"
          :content="{ align: 'end' }"
        >
          <UButton
            :icon="SHEET_ICON.menu"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="editControlClass"
            :aria-label="`${SPELL_TAB_TEXT.menu}: ${spell.name}`"
          />
        </UDropdownMenu>

        <UIcon
          v-if="isCustom"
          name="tabler:chevron-down"
          class="size-4 shrink-0 text-muted transition-transform"
          :class="chevronClass"
        />
      </div>
    </div>

    <div
      v-if="isCustom && isExpanded"
      class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
    >
      <div
        v-if="statRows.length"
        class="flex flex-wrap gap-x-4 gap-y-1"
      >
        <span
          v-for="row in statRows"
          :key="row.key"
          class="flex items-baseline gap-1 text-xs"
        >
          <span class="text-muted">{{ row.label }}:</span>

          <span class="text-toned">{{ row.value }}</span>
        </span>
      </div>

      <p
        v-if="spell.description"
        class="text-sm whitespace-pre-line text-toned"
      >
        {{ spell.description }}
      </p>

      <span
        v-else-if="!statRows.length"
        class="text-xs text-dimmed"
      >
        {{ SPELL_TAB_TEXT.emptyDescription }}
      </span>
    </div>
  </div>
</template>
