<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    CatalogOption,
    ItemSearchKind,
    SheetItem,
    WeaponAttack,
  } from '../model';

  import { ContentEntityDrawer } from '~content/entity-drawer';
  import { MAGIC_ITEMS_SECTION } from '~inventory/model';
  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useRemoveConfirm,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    SheetAttunementModal,
    SheetCarryingModal,
    SheetCatalogPicker,
    SheetConfirmModal,
    SheetCurrencyModal,
    SheetItemModal,
  } from '../dialogs';
  import {
    ATTUNEMENT_TEXT,
    CARRYING_TEXT,
    copyItemAsCustom,
    createSheetElementId,
    createSheetItem,
    CURRENCY_KEYS,
    CURRENCY_LABELS,
    CURRENCY_TITLES,
    getItemPreviewType,
    getWeaponAttack,
    INVENTORY_GROUPS,
    isHeavyWeaponHindered,
    ITEM_ROW_TEXT,
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
    sortItemsByName,
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

  const { document, update, editControlClass, ensureEditable } =
    useCharacterSheet();

  const {
    isOpen: isRemoveOpen,
    title: removeTitle,
    description: removeDescription,
    ask: askRemove,
    confirm: confirmRemove,
  } = useRemoveConfirm();

  const { stats } = useSheetStats();
  const { rollD20, rollDamage, rollFormula } = useSheetRoll();

  const pickerKind = ref<ItemSearchKind>('item');
  const isPickerOpen = ref(false);
  const editedItem = ref<SheetItem | null>(null);
  const isEditOpen = ref(false);

  const isCarryingOpen = ref(false);
  const previewItem = ref<SheetItem | null>(null);

  const previewType = computed(() =>
    getItemPreviewType(previewItem.value?.url ?? null),
  );

  const isPreviewOpen = computed({
    get: () => previewItem.value !== null,
    set: (open: boolean) => {
      if (!open) {
        previewItem.value = null;
      }
    },
  });

  const isAttunementOpen = ref(false);
  const isCurrencyOpen = ref(false);

  const weight = computed(() => stats.value.carriedWeight);
  const capacity = computed(() => stats.value.carrying.value);

  const weightClass = computed(() => {
    if (weight.value > capacity.value || stats.value.encumbrance === 'heavy') {
      return 'text-error';
    }

    return stats.value.encumbrance === 'encumbered'
      || stats.value.isArmorTooHeavy
      ? 'text-warning'
      : 'text-highlighted';
  });

  const weightHint = computed(() => {
    if (stats.value.encumbrance === 'heavy') {
      return CARRYING_TEXT.heavilyEncumbered;
    }

    if (stats.value.encumbrance === 'encumbered') {
      return CARRYING_TEXT.encumbered;
    }

    return weight.value > capacity.value
      ? CARRYING_TEXT.overloaded
      : SHEET_LABELS.carryingCapacity;
  });

  const attunedCount = computed(
    () => document.value.inventory.filter((item) => item.isAttuned).length,
  );

  const attunementLimit = computed(() => stats.value.attunement.value);

  const isOverAttuned = computed(
    () => attunedCount.value > attunementLimit.value,
  );

  const attunementClass = computed(() =>
    isOverAttuned.value ? 'text-error' : 'text-highlighted',
  );

  const attunementHint = computed(() =>
    isOverAttuned.value ? ATTUNEMENT_TEXT.overLimit : ATTUNEMENT_TEXT.limit,
  );

  /** Свои валюты — в строке монет после обычных. */
  const customCurrencies = computed(() =>
    document.value.customCurrencies.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      label: entry.short || entry.name,
      title: entry.name,
    })),
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
   * Прибавка эффектов к атаке оружием.
   * @param item - предмет
   */
  function getAttackEffects(item: SheetItem): number {
    return item.weapon?.isRanged
      ? stats.value.rangedAttackBonus
      : stats.value.meleeAttackBonus;
  }

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

    return {
      ...attack,
      attackBonus: attack.attackBonus + getAttackEffects(item),
    };
  }

  const groups = computed(() =>
    INVENTORY_GROUPS.map((group) => ({
      ...group,
      items: sortItemsByName(
        document.value.inventory.filter(
          (item) => getItemGroup(item) === group.key,
        ),
      ).map((item) => ({
        item,
        attack: getAttack(item),
        attackEffects: getAttackEffects(item),
        isHindered: isHeavyWeaponHindered(item, document.value.size),
      })),
    })).filter((group) => group.items.length),
  );

  /**
   * Открывает поиск по разделу снаряжения.
   * @param kind - раздел справочника
   */
  function openPicker(kind: ItemSearchKind): void {
    if (!ensureEditable()) {
      return;
    }

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
    if (!ensureEditable()) {
      return;
    }

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
    if (!ensureEditable()) {
      return;
    }

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
   * Хват универсального оружия: одной или двумя руками.
   * @param id - предмет
   */
  function toggleGrip(id: string): void {
    patchItem(id, (item) => ({ ...item, useTwoHands: !item.useTwoHands }));
  }

  /**
   * Включает или выключает предмет.
   * @param id - предмет
   */
  function toggleActive(id: string): void {
    patchItem(id, (item) => ({ ...item, isActive: !item.isActive }));
  }

  /**
   * Описание предмета справочника в дровере.
   * @param item - предмет
   */
  function openPreview(item: SheetItem): void {
    previewItem.value = item;
  }

  /**
   * Копия предмета справочника как свой предмет: правится целиком.
   * @param item - предмет
   */
  function copyItem(item: SheetItem): void {
    if (!ensureEditable()) {
      return;
    }

    const copy = copyItemAsCustom(item, createSheetElementId());

    update((current) => ({
      ...current,
      inventory: [...current.inventory, copy],
    }));

    toast.add({ title: ITEM_ROW_TEXT.copied, color: 'success' });
    openEdit(copy);
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

  function openCarrying(): void {
    isCarryingOpen.value = true;
  }

  function openAttunement(): void {
    isAttunementOpen.value = true;
  }

  /** Монеты меняются и на запертом листе: это игровое действие. */
  function openCurrency(): void {
    isCurrencyOpen.value = true;
  }

  /**
   * Бросок атаки оружием.
   * @param entry - предмет и его атака
   * @param entry.item - оружие
   * @param entry.attack - атака
   * @param event - клик
   */
  function rollAttack(
    entry: {
      item: SheetItem;
      attack: WeaponAttack | null;
      isHindered: boolean;
    },
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
          isHindered: entry.isHindered,
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
        entry.attack.extraDamage
          ? `${entry.attack.damage} + ${entry.attack.extraDamage}`
          : entry.attack.damage,
      );
    }
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param item - предмет
   */
  function askRemoveItem(item: { id: string; name: string }): void {
    askRemove(item.name, () => removeItem(item.id));
  }
</script>

<template>
  <div class="@container flex flex-col gap-4 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <UTooltip :text="weightHint">
          <button
            type="button"
            class="cursor-pointer"
            :class="SHEET_HEADER_STAT_CLASS"
            :aria-label="CARRYING_TEXT.title"
            @click.left.exact.prevent="openCarrying"
          >
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
          </button>
        </UTooltip>

        <UTooltip :text="attunementHint">
          <button
            type="button"
            class="cursor-pointer"
            :class="SHEET_HEADER_STAT_CLASS"
            :aria-label="ATTUNEMENT_TEXT.settings"
            @click.left.exact.prevent="openAttunement"
          >
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
                {{ attunedCount }} / {{ attunementLimit }}
              </span>
            </span>
          </button>
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

    <button
      type="button"
      class="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg border border-default/50 bg-elevated/20 px-4 py-2 transition-colors hover:border-default hover:bg-elevated/40"
      :aria-label="SHEET_LABELS.currency"
      @click.left.exact.prevent="openCurrency"
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

      <UTooltip
        v-for="entry in customCurrencies"
        :key="entry.id"
        :text="entry.title"
      >
        <span class="flex items-baseline gap-1.5">
          <span class="text-sm font-bold text-highlighted">{{
            entry.amount
          }}</span>

          <span class="text-[10px] font-bold text-muted uppercase">
            {{ entry.label }}
          </span>
        </span>
      </UTooltip>
    </button>

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
          :attack-effects="entry.attackEffects"
          :icon="group.icon"
          :is-equippable="group.key !== 'other'"
          :is-hindered="entry.isHindered"
          @toggle-equip="toggleEquip(entry.item.id)"
          @toggle-attune="toggleAttune(entry.item.id)"
          @toggle-grip="toggleGrip(entry.item.id)"
          @toggle-active="toggleActive(entry.item.id)"
          @preview="openPreview(entry.item)"
          @copy="copyItem(entry.item)"
          @adjust="adjustQuantity(entry.item.id, $event)"
          @spend-charge="spendCharge(entry.item.id)"
          @restore-charges="restoreCharges(entry.item)"
          @roll-attack="rollAttack(entry, $event)"
          @roll-damage="rollAttackDamage(entry)"
          @edit="openEdit(entry.item)"
          @remove="askRemoveItem(entry.item)"
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

    <ContentEntityDrawer
      v-if="previewItem?.url && previewType"
      v-model:open="isPreviewOpen"
      :type="previewType"
      :path="previewItem.url"
      :title="previewItem.name"
    />

    <SheetCarryingModal v-model:open="isCarryingOpen" />

    <SheetAttunementModal v-model:open="isAttunementOpen" />

    <SheetCurrencyModal v-model:open="isCurrencyOpen" />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="removeTitle"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </div>
</template>
