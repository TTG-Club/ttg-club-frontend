<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    CatalogOption,
    CurrencyKey,
    ItemSearchKind,
    SheetItem,
    WeaponAttack,
  } from '../model';

  import { MAGIC_ITEMS_SECTION } from '~inventory/model';
  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import { SheetCatalogPicker, SheetItemModal } from '../dialogs';
  import {
    ATTUNEMENT_LIMIT,
    ATTUNEMENT_TEXT,
    createSheetItem,
    CURRENCY_KEYS,
    CURRENCY_LABELS,
    CURRENCY_TITLES,
    getCarryingCapacity,
    getInventoryWeight,
    getWeaponAttack,
    INVENTORY_GROUPS,
    ITEM_SEARCH_BY_KIND,
    ITEM_SEARCH_KINDS,
    loadCatalogItem,
    loadMagicItem,
    SHEET_BODY_LABELS,
    SHEET_GROUP_LABEL_CLASS,
    SHEET_HEADER_STAT_CLASS,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_TEXT,
  } from '../model';
  import SheetInventoryItemRow from './SheetInventoryItemRow.vue';

  /**
   * Снаряжение, как на new.ttg.club: плитки переносимого веса и настройки,
   * строка монет, предметы группами (оружие, доспехи, магические предметы,
   * прочее). Магический предмет из справочника приносит настройку, заряды и
   * эффекты; эффекты работают, пока предмет надет (и настроен, если требует).
   */
  type InventoryGroupKey = (typeof INVENTORY_GROUPS)[number]['key'];

  /**
   * Группа предмета на вкладке.
   * @param item - предмет
   */
  function getItemGroup(item: SheetItem): InventoryGroupKey {
    if (item.weapon) {
      return 'weapon';
    }

    if (item.armor) {
      return 'armor';
    }

    const isMagic =
      Boolean(item.url?.startsWith(MAGIC_ITEMS_SECTION.path))
      || item.requiresAttunement
      || Boolean(item.charges)
      || item.activeEffects.length > 0;

    return isMagic ? 'magic' : 'other';
  }

  const toast = useToast();
  const { document, update, editControlClass } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollD20, rollDamage, rollFormula } = useSheetRoll();

  const pickerKind = ref<ItemSearchKind>('item');
  const isPickerOpen = ref(false);
  const editedItem = ref<SheetItem | null>(null);
  const isEditOpen = ref(false);

  const weight = computed(() => getInventoryWeight(document.value.inventory));
  const capacity = computed(() => getCarryingCapacity(stats.value.abilities));

  const weightClass = computed(() =>
    weight.value > capacity.value ? 'text-error' : 'text-highlighted',
  );

  const attunedCount = computed(
    () => document.value.inventory.filter((item) => item.isAttuned).length,
  );

  const attunementClass = computed(() =>
    attunedCount.value > ATTUNEMENT_LIMIT ? 'text-error' : 'text-highlighted',
  );

  const attunementHint = computed(() =>
    attunedCount.value > ATTUNEMENT_LIMIT
      ? ATTUNEMENT_TEXT.overLimit
      : ATTUNEMENT_TEXT.limit,
  );

  const pickerSource = computed(() => ITEM_SEARCH_BY_KIND[pickerKind.value]);

  const pickerTitle = computed(
    () =>
      ITEM_SEARCH_KINDS.find((kind) => kind.value === pickerKind.value)?.label
      ?? SHEET_LABELS.item,
  );

  const addMenuItems = computed<Array<DropdownMenuItem>>(() => [
    ...ITEM_SEARCH_KINDS.map((kind) => ({
      label: kind.label,
      icon: kind.icon,
      onSelect: () => openPicker(kind.value),
    })),
    {
      label: SHEET_LABELS.addCustom,
      icon: SHEET_ICON.add,
      onSelect: addCustom,
    },
  ]);

  /**
   * Атака оружием с характеристиками и прибавками эффектов.
   * @param item - предмет
   */
  function getAttack(item: SheetItem): WeaponAttack | null {
    const attack = getWeaponAttack(
      { ...document.value, abilities: stats.value.abilities },
      item,
      stats.value.proficiencyBonus,
    );

    if (!attack || !item.weapon) {
      return attack;
    }

    const bonus = item.weapon.isRanged
      ? stats.value.rangedAttackBonus
      : stats.value.meleeAttackBonus;

    return { ...attack, attackBonus: attack.attackBonus + bonus };
  }

  const groups = computed(() =>
    INVENTORY_GROUPS.map((group) => ({
      ...group,
      items: document.value.inventory
        .filter((item) => getItemGroup(item) === group.key)
        .map((item) => ({ item, attack: getAttack(item) })),
    })).filter((group) => group.items.length),
  );

  /**
   * Открывает поиск по разделу снаряжения.
   * @param kind - раздел справочника
   */
  function openPicker(kind: ItemSearchKind): void {
    pickerKind.value = kind;
    isPickerOpen.value = true;
  }

  /**
   * Добавляет предмет из справочника.
   * @param option - выбранная запись
   */
  async function addFromCatalog(option: CatalogOption): Promise<void> {
    try {
      const item =
        pickerKind.value === 'magic'
          ? await loadMagicItem(option)
          : await loadCatalogItem(pickerKind.value, option);

      update((current) => ({
        ...current,
        inventory: [...current.inventory, item],
      }));
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SHEET_TEXT.errorSave),
        color: 'error',
      });
    }
  }

  function addCustom(): void {
    const item = createSheetItem(SHEET_LABELS.item, null);

    update((current) => ({
      ...current,
      inventory: [...current.inventory, item],
    }));

    openEdit(item);
  }

  /**
   * Открывает правку предмета.
   * @param item - предмет
   */
  function openEdit(item: SheetItem): void {
    editedItem.value = item;
    isEditOpen.value = true;
  }

  /**
   * Меняет предмет.
   * @param id - предмет
   * @param change - новый предмет из текущего
   */
  function patchItem(id: string, change: (item: SheetItem) => SheetItem): void {
    update((current) => ({
      ...current,
      inventory: current.inventory.map((item) =>
        item.id === id ? change(item) : item,
      ),
    }));
  }

  /**
   * Заменяет предмет из окна правки.
   * @param next - изменённый предмет
   */
  function saveItem(next: SheetItem): void {
    patchItem(next.id, () => next);
  }

  /**
   * Надевает или снимает предмет.
   * @param id - предмет
   */
  function toggleEquip(id: string): void {
    patchItem(id, (item) => ({ ...item, isEquipped: !item.isEquipped }));
  }

  /**
   * Настраивается на предмет или снимает настройку.
   * @param id - предмет
   */
  function toggleAttune(id: string): void {
    patchItem(id, (item) => ({ ...item, isAttuned: !item.isAttuned }));
  }

  /**
   * Меняет количество.
   * @param id - предмет
   * @param delta - на сколько
   */
  function adjustQuantity(id: string, delta: number): void {
    patchItem(id, (item) => ({
      ...item,
      quantity: Math.max(0, item.quantity + delta),
    }));
  }

  /**
   * Тратит заряд.
   * @param id - предмет
   */
  function spendCharge(id: string): void {
    patchItem(id, (item) =>
      item.charges
        ? {
            ...item,
            charges: {
              ...item.charges,
              used: Math.min(item.charges.max, item.charges.used + 1),
            },
          }
        : item,
    );
  }

  /**
   * Восстанавливает заряды по формуле предмета (или все).
   * @param item - предмет
   */
  function restoreCharges(item: SheetItem): void {
    const charges = item.charges;

    if (!charges) {
      return;
    }

    const restored = charges.recharge.trim()
      ? rollFormula(ATTUNEMENT_TEXT.charges, charges.recharge)
      : charges.used;

    patchItem(item.id, (current) =>
      current.charges
        ? {
            ...current,
            charges: {
              ...current.charges,
              used: Math.max(0, current.charges.used - restored),
            },
          }
        : current,
    );
  }

  /**
   * Убирает предмет.
   * @param id - предмет
   */
  function removeItem(id: string): void {
    update((current) => ({
      ...current,
      inventory: current.inventory.filter((item) => item.id !== id),
    }));
  }

  /**
   * Количество монет.
   * @param key - вид монет
   * @param value - количество
   */
  function setCurrency(key: CurrencyKey, value: number | null): void {
    update((current) => ({
      ...current,
      currency: { ...current.currency, [key]: Math.max(0, value ?? 0) },
    }));
  }

  /**
   * Бросок атаки оружием.
   * @param entry - предмет и его атака
   * @param entry.item - оружие
   * @param entry.attack - атака
   * @param event - клик
   */
  function rollAttack(
    entry: { item: SheetItem; attack: WeaponAttack | null },
    event: MouseEvent,
  ): void {
    if (entry.attack) {
      rollD20(
        `${SHEET_LABELS.attack}: ${entry.attack.name}`,
        entry.attack.attackBonus,
        event,
        {
          kind: 'attack',
          attackType: entry.item.weapon?.isRanged ? 'ranged' : 'melee',
        },
      );
    }
  }

  /**
   * Бросок урона оружием.
   * @param entry - предмет и его атака
   * @param entry.attack - атака
   */
  function rollAttackDamage(entry: { attack: WeaponAttack | null }): void {
    if (entry.attack) {
      rollDamage(
        `${SHEET_LABELS.damage}: ${entry.attack.name}`,
        entry.attack.damage,
      );
    }
  }
</script>

<template>
  <div class="@container flex flex-col gap-4 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <UTooltip :text="SHEET_LABELS.carryingCapacity">
          <span :class="SHEET_HEADER_STAT_CLASS">
            <span class="flex items-center gap-1.5">
              <UIcon
                name="tabler:weight"
                class="size-4 shrink-0 text-muted @lg:hidden"
              />

              <span
                class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
              >
                {{ SHEET_BODY_LABELS.weight }}
              </span>

              <span
                class="text-xs font-bold whitespace-nowrap"
                :class="weightClass"
              >
                {{ weight }} / {{ capacity }} {{ SHEET_LABELS.weightUnit }}
              </span>
            </span>
          </span>
        </UTooltip>

        <UTooltip :text="attunementHint">
          <span :class="SHEET_HEADER_STAT_CLASS">
            <span class="flex items-center gap-1.5">
              <UIcon
                name="tabler:link"
                class="size-4 shrink-0 text-muted @lg:hidden"
              />

              <span
                class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
              >
                {{ SHEET_BODY_LABELS.attunement }}
              </span>

              <span
                class="text-xs font-bold whitespace-nowrap"
                :class="attunementClass"
              >
                {{ attunedCount }} / {{ ATTUNEMENT_LIMIT }}
              </span>
            </span>
          </span>
        </UTooltip>
      </div>

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="tabler:plus"
          :label="SHEET_BODY_LABELS.addItem"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <UPopover>
      <button
        type="button"
        class="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg border border-default/50 bg-elevated/20 px-4 py-2 transition-colors hover:border-default hover:bg-elevated/40"
        :aria-label="SHEET_LABELS.currency"
      >
        <UTooltip
          v-for="key in CURRENCY_KEYS"
          :key="key"
          :text="CURRENCY_TITLES[key]"
        >
          <span class="flex items-baseline gap-1.5">
            <span class="text-sm font-bold text-highlighted">{{
              document.currency[key]
            }}</span>

            <span class="text-[10px] font-bold text-muted uppercase">
              {{ CURRENCY_LABELS[key] }}
            </span>
          </span>
        </UTooltip>
      </button>

      <template #content>
        <div class="grid w-72 grid-cols-2 gap-2 p-3">
          <UFormField
            v-for="key in CURRENCY_KEYS"
            :key="key"
            :label="CURRENCY_TITLES[key]"
          >
            <UInputNumber
              :model-value="document.currency[key]"
              :min="0"
              size="sm"
              class="w-full"
              @update:model-value="setCurrency(key, $event)"
            />
          </UFormField>
        </div>
      </template>
    </UPopover>

    <template v-if="groups.length">
      <div
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <span :class="SHEET_GROUP_LABEL_CLASS">{{ group.title }}</span>

          <div class="h-px grow bg-default/50" />
        </div>

        <SheetInventoryItemRow
          v-for="entry in group.items"
          :key="entry.item.id"
          :item="entry.item"
          :attack="entry.attack"
          :icon="group.icon"
          :is-equippable="group.key !== 'other'"
          @toggle-equip="toggleEquip(entry.item.id)"
          @toggle-attune="toggleAttune(entry.item.id)"
          @adjust="adjustQuantity(entry.item.id, $event)"
          @spend-charge="spendCharge(entry.item.id)"
          @restore-charges="restoreCharges(entry.item)"
          @roll-attack="rollAttack(entry, $event)"
          @roll-damage="rollAttackDamage(entry)"
          @edit="openEdit(entry.item)"
          @remove="removeItem(entry.item.id)"
        />
      </div>
    </template>

    <div
      v-else
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_BODY_LABELS.emptyEquipment }}
    </div>

    <SheetCatalogPicker
      v-model:open="isPickerOpen"
      :title="pickerTitle"
      :source="pickerSource"
      @pick="addFromCatalog"
    />

    <SheetItemModal
      v-model:open="isEditOpen"
      :item="editedItem"
      @save="saveItem"
    />
  </div>
</template>
