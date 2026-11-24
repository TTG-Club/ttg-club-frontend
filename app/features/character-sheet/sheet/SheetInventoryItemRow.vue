<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { SheetItem, WeaponAttack } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    ATTUNEMENT_TEXT,
    formatModifier,
    isItemMechanicsActive,
    ITEM_ROW_TEXT,
    PROFICIENCY_MODAL_TEXT,
    SHEET_ACCENT_STAT_CLASSES,
    SHEET_BODY_LABELS,
    SHEET_ICON,
    SHEET_ITEM_STAT_LAYOUT_CLASS,
    SHEET_LABELS,
    SHEET_PLAIN_STAT_CLASSES,
    SHEET_ROLL_STAT_CLASS,
  } from '../model';

  /**
   * Карточка предмета, как на new.ttg.club: кнопка «надеть», название со
   * значками (надет, настройка, включён, хват, тяжёлое, нет в наличии, свой),
   * плитки параметров (атака с разбором и урон бросают кубики, КД, заряды —
   * клик тратит заряд, цена, вес), количество ± и меню действий. Клик по
   * названию предмета справочника открывает его описание, у своего —
   * разворачивает описание на месте.
   */
  interface ItemStat {
    key: string;
    value: string;
    label: string;
    hint: string;
    isAccent: boolean;
    action?: (click: MouseEvent) => void;
  }

  const {
    item,
    attack,
    attackEffects,
    icon,
    isEquippable,
    isHindered,
    unproficientHint,
  } = defineProps<{
    item: SheetItem;
    attack: WeaponAttack | null;
    /** Прибавка эффектов к атаке: для разбора в подсказке. */
    attackEffects: number;
    /** Значок группы для предметов, которые не надеваются. */
    icon: string;
    isEquippable: boolean;
    /** Тяжёлое оружие у Маленького: атака с помехой. */
    isHindered: boolean;
    /** Нет владения предметом: подсказка значка; null — владеет. */
    unproficientHint: string | null;
  }>();

  const emit = defineEmits<{
    'toggle-equip': [];
    'toggle-attune': [];
    'toggle-grip': [];
    'toggle-active': [];
    'adjust': [delta: number];
    'spend-charge': [];
    'restore-charges': [];
    'roll-attack': [event: MouseEvent];
    'roll-damage': [];
    'preview': [];
    'copy': [];
    'edit': [];
    'remove': [];
  }>();

  const { editControlClass } = useCharacterSheet();

  const isExpanded = ref(false);

  const isAbsent = computed(() => item.quantity <= 0);
  const isCustom = computed(() => !item.url);

  const canEquip = computed(() => isEquippable && !isAbsent.value);

  const equipButtonClass = computed(() =>
    item.isEquipped
      ? 'cursor-pointer border-primary/60 bg-primary/15 text-primary'
      : 'cursor-pointer border-default/50 bg-default/40 text-muted hover:border-primary/60',
  );

  const rowClass = computed(() => {
    if (isAbsent.value) {
      return 'border-dashed opacity-60';
    }

    return item.isEquipped
      ? 'bg-primary/5 ring-1 ring-primary/50 ring-inset'
      : undefined;
  });

  const equipLabel = computed(() =>
    item.isEquipped ? SHEET_BODY_LABELS.unequip : SHEET_BODY_LABELS.equip,
  );

  const needsAttunement = computed(
    () => item.requiresAttunement && !item.isAttuned,
  );

  const isVersatile = computed(() => Boolean(item.weapon?.versatileDamage));

  const caption = computed(() =>
    [item.notes, item.passive].filter(Boolean).join(' · '),
  );

  const hasDescription = computed(
    () => isCustom.value && Boolean(item.description.trim()),
  );

  const isNameButton = computed(() => !isCustom.value || hasDescription.value);

  const nameHint = computed(() => {
    if (!isCustom.value) {
      return ITEM_ROW_TEXT.preview;
    }

    return isExpanded.value ? ITEM_ROW_TEXT.collapse : ITEM_ROW_TEXT.expand;
  });

  /** Почему механика своего предмета сейчас не работает. */
  const inactiveReason = computed(() => {
    if (!item.activeEffects.length || isItemMechanicsActive(item)) {
      return '';
    }

    if (!item.isEquipped) {
      return ITEM_ROW_TEXT.notWorking;
    }

    if (item.requiresAttunement && !item.isAttuned) {
      return ITEM_ROW_TEXT.notAttuned;
    }

    return item.activatable && !item.isActive ? ITEM_ROW_TEXT.inactiveHint : '';
  });

  /** Разбор бонуса атаки: характеристика, владение, магия, эффекты. */
  const attackHint = computed(() => {
    if (!attack) {
      return '';
    }

    return [
      `${ITEM_ROW_TEXT.attackAbility} ${formatModifier(attack.abilityModifier)}`,
      attack.proficiency
        ? `${ITEM_ROW_TEXT.attackProficiency} ${formatModifier(attack.proficiency)}`
        : ITEM_ROW_TEXT.attackNoProficiency,
      attack.magicBonus
        ? `${ITEM_ROW_TEXT.attackMagic} ${formatModifier(attack.magicBonus)}`
        : '',
      attackEffects
        ? `${ITEM_ROW_TEXT.attackEffects} ${formatModifier(attackEffects)}`
        : '',
      isHindered ? ITEM_ROW_TEXT.heavyHint : '',
    ]
      .filter(Boolean)
      .join(' · ');
  });

  const damageValue = computed(() => {
    if (!attack) {
      return '';
    }

    return attack.extraDamage
      ? `${attack.damage} + ${attack.extraDamage}`
      : attack.damage;
  });

  const damageHint = computed(() =>
    attack
      ? [attack.damageType, attack.extraDamageType].filter(Boolean).join(' + ')
      : '',
  );

  const attackStats = computed<Array<ItemStat>>(() => {
    if (!attack) {
      return [];
    }

    const attackStat: ItemStat = {
      key: 'attack',
      value: formatModifier(attack.attackBonus),
      label: SHEET_BODY_LABELS.attack,
      hint: attackHint.value,
      isAccent: true,
      action: isAbsent.value
        ? undefined
        : (click: MouseEvent) => emit('roll-attack', click),
    };

    if (!damageValue.value) {
      return [attackStat];
    }

    return [
      attackStat,
      {
        key: 'damage',
        value: damageValue.value,
        label: attack.damageType || SHEET_BODY_LABELS.damage,
        hint: damageHint.value,
        isAccent: true,
        action: isAbsent.value ? undefined : () => emit('roll-damage'),
      },
    ];
  });

  const armorStats = computed<Array<ItemStat>>(() => {
    if (!item.armor) {
      return [];
    }

    const value = item.armor.baseArmorClass + item.armor.bonus;

    return [
      {
        key: 'armor',
        value: item.armor.category === 'SHIELD' ? `+${value}` : String(value),
        label: SHEET_BODY_LABELS.armorClassStat,
        hint: '',
        isAccent: true,
      },
    ];
  });

  const stats = computed<Array<ItemStat>>(() => [
    ...attackStats.value,
    ...armorStats.value,
    ...(item.charges
      ? [
          {
            key: 'charges',
            value: `${item.charges.max - item.charges.used}/${item.charges.max}`,
            label: SHEET_BODY_LABELS.charges,
            hint: '',
            isAccent: false,
            action: () => emit('spend-charge'),
          },
        ]
      : []),
    // Цена — когда нет боевых плиток: у оружия и доспехов её место занято
    ...(item.cost && !attack && !item.armor
      ? [
          {
            key: 'cost',
            value: item.cost,
            label: ITEM_ROW_TEXT.cost,
            hint: '',
            isAccent: false,
          },
        ]
      : []),
    ...(item.weight
      ? [
          {
            key: 'weight',
            value: `${item.weight} ${SHEET_LABELS.weightUnit}`,
            label: SHEET_BODY_LABELS.weightStat,
            hint: '',
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
    ...(isCustom.value
      ? []
      : [
          {
            label: ITEM_ROW_TEXT.copy,
            icon: 'tabler:copy',
            onSelect: () => emit('copy'),
          },
        ]),
    ...(isVersatile.value
      ? [
          {
            label: item.useTwoHands
              ? ITEM_ROW_TEXT.gripOne
              : ITEM_ROW_TEXT.gripTwo,
            icon: 'tabler:hand-grab',
            onSelect: () => emit('toggle-grip'),
          },
        ]
      : []),
    ...(item.activatable
      ? [
          {
            label: item.isActive
              ? ITEM_ROW_TEXT.deactivate
              : ITEM_ROW_TEXT.activate,
            icon: 'tabler:power',
            onSelect: () => emit('toggle-active'),
          },
        ]
      : []),
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

  /** Клик по названию: описание справочника или разворот своего. */
  function openName(): void {
    if (isCustom.value) {
      isExpanded.value = !isExpanded.value;

      return;
    }

    emit('preview');
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
          v-if="canEquip"
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
            <UTooltip
              v-if="isNameButton"
              :text="nameHint"
            >
              <button
                type="button"
                class="cursor-pointer text-left text-sm font-medium wrap-break-word text-highlighted hover:text-primary @xl:truncate"
                :aria-expanded="isCustom ? isExpanded : undefined"
                @click.left.exact.prevent="openName"
              >
                {{ item.name }}
              </button>
            </UTooltip>

            <span
              v-else
              class="text-sm font-medium wrap-break-word text-highlighted @xl:truncate"
            >
              {{ item.name }}
            </span>

            <UTooltip
              v-if="isAbsent"
              :text="ITEM_ROW_TEXT.absentHint"
            >
              <UBadge
                color="neutral"
                variant="outline"
                size="sm"
                class="shrink-0"
              >
                {{ ITEM_ROW_TEXT.absent }}
              </UBadge>
            </UTooltip>

            <UBadge
              v-if="item.isEquipped && !isAbsent"
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

            <UTooltip
              v-if="item.activatable"
              :text="ITEM_ROW_TEXT.inactiveHint"
            >
              <UBadge
                size="sm"
                :color="item.isActive ? 'success' : 'neutral'"
                variant="subtle"
                class="relative z-10 shrink-0 cursor-pointer"
                @click.left.exact.prevent="emit('toggle-active')"
              >
                {{
                  item.isActive ? ITEM_ROW_TEXT.active : ITEM_ROW_TEXT.activate
                }}
              </UBadge>
            </UTooltip>

            <UBadge
              v-if="item.useTwoHands && isVersatile"
              size="sm"
              color="neutral"
              variant="subtle"
              class="relative z-10 shrink-0 cursor-pointer"
              @click.left.exact.prevent="emit('toggle-grip')"
            >
              {{ ITEM_ROW_TEXT.twoHanded }}
            </UBadge>

            <UTooltip
              v-if="unproficientHint"
              :text="unproficientHint"
            >
              <UBadge
                size="sm"
                color="warning"
                variant="subtle"
                class="shrink-0"
              >
                {{ PROFICIENCY_MODAL_TEXT.unproficient }}
              </UBadge>
            </UTooltip>

            <UTooltip
              v-if="isHindered"
              :text="ITEM_ROW_TEXT.heavyHint"
            >
              <UBadge
                size="sm"
                color="warning"
                variant="subtle"
                class="shrink-0"
              >
                {{ ITEM_ROW_TEXT.heavy }}
              </UBadge>
            </UTooltip>

            <UBadge
              v-if="isCustom"
              size="sm"
              color="neutral"
              variant="outline"
              class="shrink-0"
            >
              {{ ITEM_ROW_TEXT.custom }}
            </UBadge>
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
          <UTooltip
            :text="stat.hint"
            :disabled="!stat.hint"
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
          </UTooltip>
        </template>
      </div>

      <div class="relative z-10 ml-auto flex shrink-0 items-center gap-1">
        <UButton
          icon="tabler:minus"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :disabled="isAbsent"
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

    <div
      v-if="isExpanded && hasDescription"
      class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
    >
      <p
        v-if="inactiveReason"
        class="text-xs text-warning"
      >
        {{ inactiveReason }}
      </p>

      <p class="text-sm whitespace-pre-line text-toned">
        {{ item.description }}
      </p>
    </div>
  </div>
</template>
