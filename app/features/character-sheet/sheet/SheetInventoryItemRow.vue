<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SheetItem, WeaponAttack } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    ATTUNEMENT_TEXT,
    formatModifier,
    SHEET_ACCENT_STAT_CLASSES,
    SHEET_BODY_LABELS,
    SHEET_ICON,
    SHEET_ITEM_STAT_LAYOUT_CLASS,
    SHEET_LABELS,
    SHEET_PLAIN_STAT_CLASSES,
    SHEET_ROLL_STAT_CLASS,
  } from '../model';

  /**
   * Карточка предмета, как на new.ttg.club: кнопка «надеть» (у оружия,
   * доспехов и магических предметов), название со значками «Надет» и
   * «Настроен», плитки параметров (атака и урон бросают кубики, КД, заряды —
   * клик тратит заряд, вес), количество ± и меню действий.
   */
  interface ItemStat {
    key: string;
    value: string;
    label: string;
    isAccent: boolean;
    action?: (click: MouseEvent) => void;
  }

  const { item, attack, icon } = defineProps<{
    item: SheetItem;
    attack: WeaponAttack | null;
    /** Значок группы для предметов, которые не надеваются. */
    icon: string;
    isEquippable: boolean;
  }>();

  const emit = defineEmits<{
    'toggle-equip': [];
    'toggle-attune': [];
    'adjust': [delta: number];
    'spend-charge': [];
    'restore-charges': [];
    'roll-attack': [event: MouseEvent];
    'roll-damage': [];
    'edit': [];
    'remove': [];
  }>();

  const { editControlClass } = useCharacterSheet();

  const equipButtonClass = computed(() =>
    item.isEquipped
      ? 'cursor-pointer border-primary/60 bg-primary/15 text-primary'
      : 'cursor-pointer border-default/50 bg-default/40 text-muted hover:border-primary/60',
  );

  const rowClass = computed(() =>
    item.isEquipped
      ? 'bg-primary/5 ring-1 ring-primary/50 ring-inset'
      : undefined,
  );

  const equipLabel = computed(() =>
    item.isEquipped ? SHEET_BODY_LABELS.unequip : SHEET_BODY_LABELS.equip,
  );

  const needsAttunement = computed(
    () => item.requiresAttunement && !item.isAttuned,
  );

  const caption = computed(() =>
    [item.notes, item.passive].filter(Boolean).join(' · '),
  );

  const stats = computed<Array<ItemStat>>(() => [
    ...(attack
      ? [
          {
            key: 'attack',
            value: formatModifier(attack.attackBonus),
            label: SHEET_BODY_LABELS.attack,
            isAccent: true,
            action: (click: MouseEvent) => emit('roll-attack', click),
          },
          ...(attack.damage
            ? [
                {
                  key: 'damage',
                  value: attack.damage,
                  label: attack.damageType || SHEET_BODY_LABELS.damage,
                  isAccent: true,
                  action: () => emit('roll-damage'),
                },
              ]
            : []),
        ]
      : []),
    ...(item.armor
      ? [
          {
            key: 'armor',
            value:
              item.armor.category === 'SHIELD'
                ? `+${item.armor.baseArmorClass + item.armor.bonus}`
                : String(item.armor.baseArmorClass + item.armor.bonus),
            label: SHEET_BODY_LABELS.armorClassStat,
            isAccent: true,
          },
        ]
      : []),
    ...(item.charges
      ? [
          {
            key: 'charges',
            value: `${item.charges.max - item.charges.used}/${item.charges.max}`,
            label: SHEET_BODY_LABELS.charges,
            isAccent: false,
            action: () => emit('spend-charge'),
          },
        ]
      : []),
    ...(item.weight
      ? [
          {
            key: 'weight',
            value: `${item.weight} ${SHEET_LABELS.weightUnit}`,
            label: SHEET_BODY_LABELS.weightStat,
            isAccent: false,
          },
        ]
      : []),
  ]);

  const displayStats = computed(() =>
    stats.value.map((stat) => {
      const classes = stat.isAccent
        ? SHEET_ACCENT_STAT_CLASSES
        : SHEET_PLAIN_STAT_CLASSES;

      return {
        ...stat,
        containerClass: stat.action
          ? `${classes.container} ${SHEET_ROLL_STAT_CLASS}`
          : classes.container,
        valueClass: classes.value,
        labelClass: classes.label,
      };
    }),
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    {
      label: SHEET_BODY_LABELS.edit,
      icon: SHEET_ICON.edit,
      onSelect: () => emit('edit'),
    },
    ...(item.requiresAttunement
      ? [
          {
            label: item.isAttuned
              ? SHEET_BODY_LABELS.unattune
              : SHEET_BODY_LABELS.attune,
            icon: 'tabler:link',
            onSelect: () => emit('toggle-attune'),
          },
        ]
      : []),
    ...(item.charges?.used
      ? [
          {
            label: SHEET_BODY_LABELS.restoreCharges,
            icon: 'tabler:battery-charging',
            onSelect: () => emit('restore-charges'),
          },
        ]
      : []),
    {
      label: SHEET_BODY_LABELS.remove,
      icon: SHEET_ICON.remove,
      color: 'error',
      onSelect: () => emit('remove'),
    },
  ]);

  /**
   * Запуск действия плитки: модификаторы клика задают преимущество или
   * помеху броска атаки.
   * @param stat - плитка
   * @param click - событие клика
   */
  function runStat(stat: ItemStat, click: MouseEvent): void {
    stat.action?.(click);
  }
</script>

<template>
  <div
    class="@container flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
    :class="rowClass"
  >
    <div class="relative flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
      <div class="flex w-full min-w-0 items-center gap-3 @xl:w-auto @xl:flex-1">
        <UTooltip
          v-if="isEquippable"
          :text="equipLabel"
        >
          <button
            type="button"
            class="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors"
            :class="equipButtonClass"
            :aria-pressed="item.isEquipped"
            :aria-label="`${equipLabel}: ${item.name}`"
            @click.left.exact.prevent="emit('toggle-equip')"
          >
            <UIcon
              :name="icon"
              class="size-5"
            />
          </button>
        </UTooltip>

        <span
          v-else
          class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default/50 bg-default/40"
        >
          <UIcon
            :name="icon"
            class="size-5 text-muted"
          />
        </span>

        <div class="flex min-w-0 grow flex-col text-left">
          <span
            class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 @xl:flex-nowrap"
          >
            <NuxtLink
              v-if="item.url"
              :to="item.url"
              target="_blank"
              class="text-sm font-medium wrap-break-word text-highlighted hover:text-primary @xl:truncate"
            >
              {{ item.name }}
            </NuxtLink>

            <span
              v-else
              class="text-sm font-medium wrap-break-word text-highlighted @xl:truncate"
            >
              {{ item.name }}
            </span>

            <UBadge
              v-if="item.isEquipped"
              color="primary"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              {{ SHEET_BODY_LABELS.equipped }}
            </UBadge>

            <UTooltip
              v-if="needsAttunement"
              :text="SHEET_BODY_LABELS.needsAttunementHint"
            >
              <UBadge
                size="sm"
                color="warning"
                variant="subtle"
                class="relative z-10 shrink-0 cursor-pointer"
                @click.left.exact.prevent="emit('toggle-attune')"
              >
                {{ SHEET_BODY_LABELS.needsAttunement }}
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="item.isAttuned"
              :text="ATTUNEMENT_TEXT.attuned"
            >
              <UBadge
                size="sm"
                color="primary"
                variant="subtle"
                class="relative z-10 shrink-0 cursor-pointer"
                @click.left.exact.prevent="emit('toggle-attune')"
              >
                {{ SHEET_BODY_LABELS.attuned }}
              </UBadge>
            </UTooltip>
          </span>

          <span
            v-if="caption"
            class="text-xs wrap-break-word text-dimmed @xl:truncate"
          >
            {{ caption }}
          </span>
        </div>
      </div>

      <div
        v-if="displayStats.length"
        class="flex grow flex-wrap items-center gap-1.5 @xl:grow-0"
      >
        <template
          v-for="stat in displayStats"
          :key="stat.key"
        >
          <button
            v-if="stat.action"
            type="button"
            class="transition-colors"
            :class="[SHEET_ITEM_STAT_LAYOUT_CLASS, stat.containerClass]"
            :aria-label="`${stat.label}: ${item.name}`"
            @click.left.prevent="runStat(stat, $event)"
          >
            <span
              class="text-xs font-bold"
              :class="stat.valueClass"
            >
              {{ stat.value }}
            </span>

            <span
              class="text-[9px] uppercase"
              :class="stat.labelClass"
            >
              {{ stat.label }}
            </span>
          </button>

          <div
            v-else
            :class="[SHEET_ITEM_STAT_LAYOUT_CLASS, stat.containerClass]"
          >
            <span
              class="text-xs font-bold"
              :class="stat.valueClass"
            >
              {{ stat.value }}
            </span>

            <span
              class="text-[9px] uppercase"
              :class="stat.labelClass"
            >
              {{ stat.label }}
            </span>
          </div>
        </template>
      </div>

      <div class="relative z-10 ml-auto flex shrink-0 items-center gap-1">
        <UButton
          icon="tabler:minus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :disabled="item.quantity <= 0"
          :aria-label="`${SHEET_BODY_LABELS.quantityDecrease}: ${item.name}`"
          @click.left.exact.prevent="emit('adjust', -1)"
        />

        <span class="w-6 text-center text-sm font-medium text-default">
          {{ item.quantity }}
        </span>

        <UButton
          icon="tabler:plus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :aria-label="`${SHEET_BODY_LABELS.quantityIncrease}: ${item.name}`"
          @click.left.exact.prevent="emit('adjust', 1)"
        />

        <UDropdownMenu
          :items="menuItems"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="tabler:dots-vertical"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="editControlClass"
            :aria-label="`${SHEET_BODY_LABELS.menu}: ${item.name}`"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>
