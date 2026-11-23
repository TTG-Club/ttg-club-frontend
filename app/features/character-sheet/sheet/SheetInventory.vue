<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    CatalogOption,
    CurrencyKey,
    ItemSearchKind,
    SheetItem,
    WeaponAttack,
  } from '../model';

  import { getApiErrorMessage } from '~user/model';

  import { useCharacterSheet, useSheetRoll } from '../composables';
  import { SheetCatalogPicker, SheetItemModal } from '../dialogs';
  import {
    createSheetItem,
    CURRENCY_KEYS,
    CURRENCY_LABELS,
    CURRENCY_TITLES,
    formatModifier,
    getCarryingCapacity,
    getCharacterLevel,
    getInventoryWeight,
    getProficiencyBonus,
    getWeaponAttacks,
    ITEM_SEARCH_BY_KIND,
    ITEM_SEARCH_KINDS,
    loadCatalogItem,
    SHEET_ICON,
    SHEET_LABELS,
    SHEET_TEXT,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Снаряжение: атаки оружием, предметы, монеты и переносимый вес. Предметы
   * добавляются из справочника (оружие и доспехи — с боевыми свойствами) или
   * свои.
   */
  const toast = useToast();
  const { document, update } = useCharacterSheet();
  const { rollD20, rollDamage } = useSheetRoll();

  const pickerKind = ref<ItemSearchKind>('item');
  const isPickerOpen = ref(false);
  const editedItem = ref<SheetItem | null>(null);
  const isEditOpen = ref(false);

  const proficiencyBonus = computed(() =>
    getProficiencyBonus(getCharacterLevel(document.value.classes)),
  );

  const attacks = computed(() =>
    getWeaponAttacks(document.value, proficiencyBonus.value).map((attack) => ({
      ...attack,
      attackLabel: formatModifier(attack.attackBonus),
    })),
  );

  const weight = computed(() => getInventoryWeight(document.value.inventory));

  const capacity = computed(() =>
    getCarryingCapacity(document.value.abilities),
  );

  const weightLabel = computed(
    () =>
      `${SHEET_LABELS.weight}: ${weight.value} / ${capacity.value} ${SHEET_LABELS.weightUnit}`,
  );

  const weightClass = computed(() =>
    weight.value > capacity.value ? 'text-error' : 'text-muted',
  );

  const pickerSource = computed(() => ITEM_SEARCH_BY_KIND[pickerKind.value]);

  const pickerTitle = computed(
    () =>
      ITEM_SEARCH_KINDS.find((kind) => kind.value === pickerKind.value)?.label
      ?? SHEET_LABELS.item,
  );

  const addMenuItems = computed<Array<DropdownMenuItem>>(() =>
    ITEM_SEARCH_KINDS.map((kind) => ({
      label: kind.label,
      icon: kind.icon,
      onSelect: () => openPicker(kind.value),
    })),
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
      const item = await loadCatalogItem(pickerKind.value, option);

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

  /** Добавляет свой предмет и сразу открывает его правку. */
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
   * Заменяет предмет.
   * @param next - изменённый предмет
   */
  function saveItem(next: SheetItem): void {
    update((current) => ({
      ...current,
      inventory: current.inventory.map((item) =>
        item.id === next.id ? next : item,
      ),
    }));
  }

  /**
   * Меняет поле предмета.
   * @param id - идентификатор предмета
   * @param patch - изменённые поля
   */
  function patchItem(id: string, patch: Partial<SheetItem>): void {
    update((current) => ({
      ...current,
      inventory: current.inventory.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  /**
   * Убирает предмет.
   * @param id - идентификатор предмета
   */
  function removeItem(id: string): void {
    update((current) => ({
      ...current,
      inventory: current.inventory.filter((item) => item.id !== id),
    }));
  }

  /**
   * Меняет количество монет.
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
   * Бросок атаки.
   * @param attack - атака
   * @param event - клик
   */
  function rollAttack(attack: WeaponAttack, event: MouseEvent): void {
    rollD20(
      `${SHEET_LABELS.attack}: ${attack.name}`,
      attack.attackBonus,
      event,
    );
  }

  /**
   * Бросок урона.
   * @param attack - атака
   */
  function rollAttackDamage(attack: WeaponAttack): void {
    rollDamage(`${SHEET_LABELS.damage}: ${attack.name}`, attack.damage);
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <SheetPanel :title="SHEET_LABELS.attacks">
      <table
        v-if="attacks.length"
        class="w-full text-sm"
      >
        <tbody>
          <tr
            v-for="attack in attacks"
            :key="attack.id"
            class="border-b border-default last:border-0"
          >
            <td class="py-1 text-highlighted">{{ attack.name }}</td>

            <td class="py-1 text-right">
              <UButton
                :label="attack.attackLabel"
                color="neutral"
                variant="subtle"
                size="xs"
                @click.left.prevent="rollAttack(attack, $event)"
              />
            </td>

            <td class="py-1 text-right">
              <UButton
                v-if="attack.damage"
                :label="attack.damage"
                :icon="SHEET_ICON.dice"
                color="neutral"
                variant="ghost"
                size="xs"
                @click.left.exact.prevent="rollAttackDamage(attack)"
              />
            </td>

            <td class="py-1 text-right text-muted">{{ attack.damageType }}</td>
          </tr>
        </tbody>
      </table>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ SHEET_LABELS.emptyAttacks }}
      </p>
    </SheetPanel>

    <SheetPanel :title="SHEET_LABELS.inventory">
      <template #actions>
        <span
          class="text-xs"
          :class="weightClass"
        >
          {{ weightLabel }}
        </span>

        <UDropdownMenu :items="addMenuItems">
          <UButton
            :label="SHEET_LABELS.addFromCatalog"
            :icon="SHEET_ICON.catalog"
            color="neutral"
            variant="subtle"
            size="xs"
          />
        </UDropdownMenu>

        <UButton
          :label="SHEET_LABELS.addCustom"
          :icon="SHEET_ICON.add"
          color="neutral"
          variant="subtle"
          size="xs"
          @click.left.exact.prevent="addCustom"
        />
      </template>

      <ul
        v-if="document.inventory.length"
        class="flex flex-col"
      >
        <li
          v-for="item in document.inventory"
          :key="item.id"
          class="flex items-center gap-2 border-b border-default py-1 last:border-0"
        >
          <UTooltip :text="SHEET_LABELS.equipped">
            <UCheckbox
              :model-value="item.isEquipped"
              :aria-label="SHEET_LABELS.equipped"
              @update:model-value="
                patchItem(item.id, { isEquipped: $event === true })
              "
            />
          </UTooltip>

          <NuxtLink
            v-if="item.url"
            :to="item.url"
            target="_blank"
            class="min-w-0 flex-1 truncate text-link hover:underline"
          >
            {{ item.name }}
          </NuxtLink>

          <span
            v-else
            class="min-w-0 flex-1 truncate"
          >
            {{ item.name }}
          </span>

          <UInputNumber
            :model-value="item.quantity"
            :min="0"
            size="xs"
            class="w-20"
            :aria-label="SHEET_LABELS.quantity"
            @update:model-value="patchItem(item.id, { quantity: $event ?? 0 })"
          />

          <UButton
            :icon="SHEET_ICON.edit"
            :aria-label="SHEET_LABELS.edit"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="openEdit(item)"
          />

          <UButton
            :icon="SHEET_ICON.remove"
            :aria-label="SHEET_LABELS.remove"
            color="error"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="removeItem(item.id)"
          />
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ SHEET_LABELS.emptyInventory }}
      </p>
    </SheetPanel>

    <SheetPanel :title="SHEET_LABELS.currency">
      <div class="grid grid-cols-5 gap-2">
        <UFormField
          v-for="key in CURRENCY_KEYS"
          :key="key"
          :label="CURRENCY_LABELS[key]"
          :title="CURRENCY_TITLES[key]"
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
    </SheetPanel>

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
