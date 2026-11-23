<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    CatalogRow,
    PreparedKind,
    SheetSpell,
    SpellDamageTile,
    SpellOrigin,
  } from '../model';

  import { ContentEntityDrawer } from '~content/entity-drawer';
  import { getApiErrorMessage } from '~user/model';

  import {
    useCharacterSheet,
    useRemoveConfirm,
    useSheetRoll,
    useSheetSpellcasting,
    useSheetStats,
    useSpellDetails,
  } from '../composables';
  import {
    SheetCatalogAddModal,
    SheetConfirmModal,
    SheetPreparedSpellsModal,
    SheetSpellAbilityModal,
    SheetSpellcastingModal,
    SheetSpellCastModal,
    SheetSpellModal,
  } from '../dialogs';
  import {
    ABILITY_LABELS,
    copySpellAsCustom,
    createSheetElementId,
    createSheetSpell,
    createSpellCatalogPreset,
    formatModifier,
    formatPreparedValue,
    getSpellAbilityModifier,
    getSpellDamageTiles,
    getSpellListLevels,
    getSpellOrigin,
    isCantrip,
    loadCatalogSpell,
    matchesSpellFilter,
    PREPARED_ICON,
    PREPARED_KINDS,
    PREPARED_TEXT,
    SHEET_GROUP_LABEL_CLASS,
    SHEET_HEADER_STAT_CLASS,
    SHEET_ICON,
    SPELL_ADD_TEXT,
    SPELL_CATALOG_SOURCE,
    SPELL_FILTER_CHIP_CLASS,
    SPELL_GROUP_ORDER,
    SPELL_GROUP_TEXT,
    SPELL_ICON,
    SPELL_SLOT_TEXT,
    SPELL_TAB_TEXT,
  } from '../model';
  import SheetSpellRow from './SheetSpellRow.vue';

  /**
   * Заклинания, как на new.ttg.club: плитки Сл и атаки по каждому
   * классу-заклинателю, пределы подготовленных заклинаний и заговоров,
   * чипы отбора, группы выданных заговоров и заклинаний вида и черт, круги
   * с ячейками в разделителе и строки с переключателем подготовки, уроном и
   * меню действий.
   */
  const toast = useToast();

  const { document, update, ensureEditable, editControlClass } =
    useCharacterSheet();

  const { stats } = useSheetStats();
  const { rollDamage } = useSheetRoll();
  const spellDetails = useSpellDetails();

  const {
    rows,
    primaryAbility,
    spellsLimit,
    cantripsLimit,
    slotRows,
    pact,
    pactUsed,
  } = useSheetSpellcasting();

  const {
    isOpen: isRemoveOpen,
    title: removeTitle,
    description: removeDescription,
    ask: askRemove,
    confirm: confirmRemove,
  } = useRemoveConfirm();

  const spellcastingClassId = ref<string | null>(null);
  const isSpellcastingOpen = ref(false);
  const preparedKind = ref<PreparedKind>('spells');
  const isPreparedOpen = ref(false);
  const isAddOpen = ref(false);
  const editedSpell = ref<SheetSpell | null>(null);
  const isEditOpen = ref(false);
  const activeSpellId = ref<string | null>(null);
  const isAbilityOpen = ref(false);
  const isCastOpen = ref(false);
  const previewSpell = ref<SheetSpell | null>(null);

  const isPreparedOnly = ref(false);
  const pickedLevels = ref<Array<number>>([]);

  const spellUrls = computed(() =>
    document.value.spells.flatMap((spell) => (spell.url ? [spell.url] : [])),
  );

  watch(spellUrls, (urls) => spellDetails.ensure(urls), { immediate: true });

  /* --- Шапка ------------------------------------------------------------ */

  const spellcastingTiles = computed(() =>
    rows.value.map((row) => ({
      key: row.classId ?? 'character',
      classId: row.classId,
      className: rows.value.length > 1 ? row.className : '',
      saveDc: row.saveDc === null ? '—' : String(row.saveDc),
      attack: row.attack === null ? '—' : formatModifier(row.attack),
      ability: row.ability ? ABILITY_LABELS[row.ability].short : '',
      ariaLabel: row.classId
        ? `${SPELL_TAB_TEXT.editSpellcasting}: ${row.className}`
        : SPELL_TAB_TEXT.editSpellcasting,
    })),
  );

  const preparedTiles = computed(() =>
    PREPARED_KINDS.flatMap((kind) => {
      const breakdown =
        kind === 'cantrips' ? cantripsLimit.value : spellsLimit.value;

      if (kind === 'cantrips' && breakdown.value === null && !breakdown.count) {
        return [];
      }

      let label: string = PREPARED_TEXT.limit;
      let hint: string = PREPARED_TEXT.hint;

      if (kind === 'cantrips') {
        label = PREPARED_TEXT.cantrips;
        hint = PREPARED_TEXT.cantripsHint;
      } else if (breakdown.isKnown) {
        label = PREPARED_TEXT.known;
        hint = PREPARED_TEXT.knownHint;
      }

      const isOver =
        breakdown.value !== null && breakdown.count > breakdown.value;

      return [
        {
          kind,
          label,
          hint: isOver ? `${hint}. ${PREPARED_TEXT.over}` : hint,
          icon: PREPARED_ICON[kind],
          value: formatPreparedValue(breakdown),
          valueClass: isOver ? 'text-error' : 'text-highlighted',
        },
      ];
    }),
  );

  const addMenuItems = computed<Array<DropdownMenuItem>>(() => [
    {
      label: SPELL_TAB_TEXT.addFromCatalog,
      icon: SHEET_ICON.catalog,
      onSelect: openAdd,
    },
    {
      label: SPELL_TAB_TEXT.addCustom,
      icon: SHEET_ICON.edit,
      onSelect: openCreate,
    },
  ]);

  /**
   * Настройка характеристики строки заклинательства.
   * @param classId - класс листа; null — строка персонажа
   */
  function openSpellcasting(classId: string | null): void {
    if (!ensureEditable()) {
      return;
    }

    spellcastingClassId.value = classId;
    isSpellcastingOpen.value = true;
  }

  /**
   * Настройка предела.
   * @param kind - заклинания или заговоры
   */
  function openPrepared(kind: PreparedKind): void {
    if (!ensureEditable()) {
      return;
    }

    preparedKind.value = kind;
    isPreparedOpen.value = true;
  }

  /* --- Отбор ------------------------------------------------------------ */

  const origins = computed(
    () =>
      new Map(
        document.value.spells.map((spell) => [
          spell.id,
          getSpellOrigin(spell, document.value.sources),
        ]),
      ),
  );

  /**
   * Происхождение заклинания.
   * @param spell - заклинание
   */
  function getOrigin(spell: SheetSpell): SpellOrigin {
    return origins.value.get(spell.id) ?? 'book';
  }

  /**
   * Выданный заговор подготовлен всегда.
   * @param spell - заклинание
   */
  function isGrantedCantrip(spell: SheetSpell): boolean {
    return isCantrip(spell) && getOrigin(spell) !== 'book';
  }

  /**
   * Заклинание вида, черты или предыстории (не заговор).
   * @param spell - заклинание
   */
  function isInnateSpell(spell: SheetSpell): boolean {
    return !isCantrip(spell) && getOrigin(spell) === 'innate';
  }

  /**
   * Подготовлено ли заклинание с учётом «всегда».
   * @param spell - заклинание
   */
  function isSpellPrepared(spell: SheetSpell): boolean {
    return spell.isPrepared || spell.alwaysPrepared || isGrantedCantrip(spell);
  }

  const availableLevels = computed(() =>
    getSpellListLevels(document.value.spells, [
      ...slotRows.value.map((row) => row.level),
      ...(pact.value ? [pact.value.level] : []),
    ]),
  );

  const filter = computed(() => ({
    preparedOnly: isPreparedOnly.value,
    levels: pickedLevels.value.filter((level) =>
      availableLevels.value.includes(level),
    ),
  }));

  const hasFilter = computed(
    () => filter.value.preparedOnly || filter.value.levels.length > 0,
  );

  const preparedChipClass = computed(() => [
    SPELL_FILTER_CHIP_CLASS.base,
    isPreparedOnly.value
      ? SPELL_FILTER_CHIP_CLASS.selected
      : SPELL_FILTER_CHIP_CLASS.idle,
  ]);

  const levelChips = computed(() => {
    if (availableLevels.value.length < 2) {
      return [];
    }

    return availableLevels.value.map((level) => {
      const isPicked = filter.value.levels.includes(level);

      return {
        level,
        label: String(level),
        hint: level ? `${level} круг` : SPELL_GROUP_TEXT.cantrips,
        isPicked,
        chipClass: [
          SPELL_FILTER_CHIP_CLASS.base,
          'min-w-7 text-center',
          isPicked
            ? SPELL_FILTER_CHIP_CLASS.selected
            : SPELL_FILTER_CHIP_CLASS.idle,
        ],
      };
    });
  });

  function togglePreparedOnly(): void {
    isPreparedOnly.value = !isPreparedOnly.value;
  }

  /**
   * Круг в отборе: повторное нажатие снимает.
   * @param level - круг
   */
  function toggleLevel(level: number): void {
    pickedLevels.value = pickedLevels.value.includes(level)
      ? pickedLevels.value.filter((entry) => entry !== level)
      : [...pickedLevels.value, level];
  }

  function resetFilter(): void {
    isPreparedOnly.value = false;
    pickedLevels.value = [];
  }

  /* --- Список ----------------------------------------------------------- */

  /**
   * Плитки урона заклинания на его собственном круге.
   * @param spell - заклинание
   */
  function getTiles(spell: SheetSpell): Array<SpellDamageTile> {
    const damage = spell.url
      ? (spellDetails.get(spell.url)?.damage ?? null)
      : spell.damage;

    return getSpellDamageTiles(damage, {
      abilityModifier: getSpellAbilityModifier(
        spell,
        primaryAbility.value,
        stats.value.bonusContext.abilityModifiers,
      ),
      characterLevel: stats.value.level,
      spellLevel: spell.level,
      slotLevel: spell.level,
    });
  }

  /**
   * Подсказка квадрата подготовки и можно ли им переключать.
   * @param spell - заклинание
   */
  function getToggle(spell: SheetSpell): {
    isToggleable: boolean;
    hint: string;
  } {
    if (isGrantedCantrip(spell)) {
      return { isToggleable: false, hint: SPELL_TAB_TEXT.grantedCantrip };
    }

    if (spell.alwaysPrepared) {
      return { isToggleable: false, hint: SPELL_TAB_TEXT.alwaysPrepared };
    }

    const label = spell.isPrepared
      ? SPELL_TAB_TEXT.unprepare
      : SPELL_TAB_TEXT.prepare;

    if (getOrigin(spell) === 'innate') {
      return {
        isToggleable: true,
        hint: `${label}. ${SPELL_TAB_TEXT.outOfLimit}`,
      };
    }

    const limit = spellsLimit.value;

    const isFull =
      !isCantrip(spell)
      && !spell.isPrepared
      && limit.value !== null
      && limit.count >= limit.value;

    return {
      isToggleable: true,
      hint: isFull ? `${label}. ${SPELL_TAB_TEXT.limitReached}` : label,
    };
  }

  /**
   * Строка заклинания для шаблона.
   * @param spell - заклинание
   */
  function toRow(spell: SheetSpell) {
    const toggle = getToggle(spell);

    return {
      spell,
      origin: getOrigin(spell),
      isPrepared: isSpellPrepared(spell),
      isToggleable: toggle.isToggleable,
      toggleHint: toggle.hint,
      tiles: getTiles(spell),
      abilityLabel: spell.spellcastingAbility
        ? ABILITY_LABELS[spell.spellcastingAbility].short
        : null,
    };
  }

  /**
   * Заклинания по алфавиту.
   * @param spells - заклинания
   */
  function sortByName(spells: ReadonlyArray<SheetSpell>): Array<SheetSpell> {
    return [...spells].sort((left, right) =>
      left.name.localeCompare(right.name, 'ru'),
    );
  }

  /**
   * Кружки ячеек ряда.
   * @param level - круг
   * @param max - всего ячеек
   * @param used - потрачено
   * @param kind - обычные или договора
   */
  function getCircles(
    level: number,
    max: number,
    used: number,
    kind: 'slot' | 'pact',
  ) {
    const usedClass =
      kind === 'pact'
        ? 'border-secondary bg-secondary'
        : 'border-primary bg-primary';

    const idleClass =
      kind === 'pact'
        ? 'border-secondary/50 hover:border-secondary'
        : 'border-default hover:border-primary';

    return Array.from({ length: max }, (_, index) => ({
      index,
      level,
      kind,
      isUsed: index < used,
      label: SPELL_SLOT_TEXT.slot(level, index + 1),
      circleClass: index < used ? usedClass : idleClass,
    }));
  }

  /**
   * Ячейки круга для разделителя: обычные и договора.
   * @param level - круг
   */
  function getSlotGroups(level: number) {
    const regular = slotRows.value
      .filter((row) => row.level === level)
      .map((row) => ({
        kind: 'slot' as const,
        label: SPELL_TAB_TEXT.slots,
        summary: SPELL_SLOT_TEXT.summary(row.max - row.used, row.max),
        circles: getCircles(level, row.max, row.used, 'slot'),
      }));

    const current = pact.value;

    if (!current || current.level !== level) {
      return regular;
    }

    return [
      ...regular,
      {
        kind: 'pact' as const,
        label: SPELL_TAB_TEXT.pactSlots,
        summary: SPELL_SLOT_TEXT.pactSummary(
          current.slots - pactUsed.value,
          current.slots,
        ),
        circles: getCircles(level, current.slots, pactUsed.value, 'pact'),
      },
    ];
  }

  const groups = computed(() => {
    const visible = document.value.spells.filter((spell) =>
      matchesSpellFilter(spell, filter.value, isSpellPrepared(spell)),
    );

    const regular = visible.filter(
      (spell) => !isGrantedCantrip(spell) && !isInnateSpell(spell),
    );

    const slotLevels = filter.value.preparedOnly
      ? []
      : availableLevels.value.filter(
          (level) =>
            level > 0
            && (!filter.value.levels.length
              || filter.value.levels.includes(level)),
        );

    const levels = [
      ...new Set([...regular.map((spell) => spell.level), ...slotLevels]),
    ].sort((left, right) => left - right);

    const granted = [
      {
        key: 'granted',
        level: SPELL_GROUP_ORDER.grantedCantrips,
        title: SPELL_GROUP_TEXT.grantedCantrips,
        spells: visible.filter(isGrantedCantrip),
        slotGroups: [],
      },
      {
        key: 'innate',
        level: SPELL_GROUP_ORDER.innate,
        title: SPELL_GROUP_TEXT.innate,
        spells: visible.filter(isInnateSpell),
        slotGroups: [],
      },
    ].filter((group) => group.spells.length);

    const circles = levels.map((level) => ({
      key: `level-${level}`,
      level,
      title: level ? `${level} круг` : SPELL_GROUP_TEXT.cantrips,
      spells: regular.filter((spell) => spell.level === level),
      slotGroups: getSlotGroups(level),
    }));

    return [...granted, ...circles].map((group) => ({
      ...group,
      rows: sortByName(group.spells).map(toRow),
    }));
  });

  const emptyLabel = computed(() => {
    if (!document.value.spells.length) {
      return SPELL_TAB_TEXT.empty;
    }

    return groups.value.some((group) => group.rows.length)
      ? ''
      : SPELL_TAB_TEXT.filterEmpty;
  });

  /* --- Действия --------------------------------------------------------- */

  /**
   * Переключает подготовку.
   * @param spell - заклинание
   */
  function togglePrepared(spell: SheetSpell): void {
    update((current) => ({
      ...current,
      spells: current.spells.map((entry) =>
        entry.id === spell.id
          ? { ...entry, isPrepared: !entry.isPrepared }
          : entry,
      ),
    }));
  }

  /**
   * Тратит ячейки круга по кружок включительно; повторное нажатие
   * возвращает последнюю.
   * @param circle - кружок ячейки
   * @param circle.level - круг
   * @param circle.kind - обычные ячейки или договора
   * @param circle.index - номер ячейки
   */
  function toggleSlot({
    level,
    kind,
    index,
  }: {
    level: number;
    kind: 'slot' | 'pact';
    index: number;
  }): void {
    update((current) => {
      if (kind === 'pact') {
        return {
          ...current,
          pactSlotsUsed:
            current.pactSlotsUsed === index + 1 ? index : index + 1,
        };
      }

      return {
        ...current,
        spellSlotsUsed: current.spellSlotsUsed.map((used, slotIndex) => {
          if (slotIndex !== level - 1) {
            return used;
          }

          return used === index + 1 ? index : index + 1;
        }),
      };
    });
  }

  /**
   * Окно сотворения.
   * @param spell - заклинание
   */
  function openCast(spell: SheetSpell): void {
    activeSpellId.value = spell.id;
    isCastOpen.value = true;
  }

  /**
   * Бросок плитки: заговор катится сразу, заклинание круга — через выбор
   * ячейки.
   * @param spell - заклинание
   * @param tile - плитка урона
   */
  function rollTile(spell: SheetSpell, tile: SpellDamageTile): void {
    if (!isCantrip(spell)) {
      openCast(spell);

      return;
    }

    const label = tile.isHealing
      ? SPELL_TAB_TEXT.healing
      : SPELL_TAB_TEXT.damage;

    rollDamage(`${label}: ${spell.name}`, tile.formula);
  }

  /**
   * Описание заклинания справочника.
   * @param spell - заклинание
   */
  function openPreview(spell: SheetSpell): void {
    previewSpell.value = spell;
  }

  const isPreviewOpen = computed({
    get: () => previewSpell.value !== null,
    set: (value: boolean) => {
      if (!value) {
        previewSpell.value = null;
      }
    },
  });

  function openAdd(): void {
    if (ensureEditable()) {
      isAddOpen.value = true;
    }
  }

  function openCreate(): void {
    if (!ensureEditable()) {
      return;
    }

    editedSpell.value = createSheetSpell('', null);
    isEditOpen.value = true;
  }

  /**
   * Правка своего заклинания.
   * @param spell - заклинание
   */
  function openEdit(spell: SheetSpell): void {
    if (!ensureEditable()) {
      return;
    }

    editedSpell.value = spell;
    isEditOpen.value = true;
  }

  /**
   * Сохраняет своё заклинание: новое добавляется, прежнее заменяется.
   * @param saved - заклинание из окна
   */
  function saveSpell(saved: SheetSpell): void {
    update((current) => ({
      ...current,
      spells: current.spells.some((spell) => spell.id === saved.id)
        ? current.spells.map((spell) => (spell.id === saved.id ? saved : spell))
        : [...current.spells, saved],
    }));
  }

  /**
   * Своя копия заклинания справочника: заклинание книги заменяется копией,
   * у выданного копия ложится в книгу рядом с ним.
   * @param spell - заклинание
   */
  async function copySpell(spell: SheetSpell): Promise<void> {
    if (!spell.url || !ensureEditable()) {
      return;
    }

    try {
      const detail = await spellDetails.load(spell.url);
      const copy = copySpellAsCustom(spell, detail, createSheetElementId());
      const isBook = getOrigin(spell) === 'book';

      update((current) => ({
        ...current,
        spells: isBook
          ? current.spells.map((entry) =>
              entry.id === spell.id ? copy : entry,
            )
          : [...current.spells, copy],
      }));

      toast.add({ title: SPELL_TAB_TEXT.copied, color: 'success' });
      openEdit(copy);
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SPELL_TAB_TEXT.copyFailed),
        color: 'error',
      });
    }
  }

  /**
   * Своя характеристика заклинания.
   * @param spell - заклинание
   */
  function openAbility(spell: SheetSpell): void {
    if (!ensureEditable()) {
      return;
    }

    activeSpellId.value = spell.id;
    isAbilityOpen.value = true;
  }

  /**
   * Спрашивает подтверждение удаления.
   * @param spell - заклинание
   */
  function askRemoveSpell(spell: SheetSpell): void {
    if (!ensureEditable()) {
      return;
    }

    askRemove(spell.name, () =>
      update((current) => ({
        ...current,
        spells: current.spells.filter((entry) => entry.id !== spell.id),
      })),
    );
  }

  /* --- Справочник ------------------------------------------------------- */

  const maxSpellLevel = computed(() =>
    Math.max(
      0,
      ...slotRows.value.map((row) => row.level),
      pact.value?.level ?? 0,
    ),
  );

  const catalogPreset = computed(() =>
    createSpellCatalogPreset(
      document.value.classes.map((sheetClass) => sheetClass.name),
      maxSpellLevel.value,
    ),
  );

  /**
   * Заклинание справочника для листа.
   * @param row - строка окна добавления
   */
  function loadPickedSpell(row: CatalogRow): Promise<SheetSpell> {
    return loadCatalogSpell({ name: row.name, url: row.url, caption: '' });
  }

  /** Вид дровера описания: у окна заклинаний он один. */
  function getPreviewType(): 'spell' {
    return 'spell';
  }

  /**
   * Добавляет заклинания из справочника одной правкой.
   * @param spells - загруженные заклинания
   */
  function addFromCatalog(spells: Array<SheetSpell>): void {
    update((current) => ({
      ...current,
      spells: [...current.spells, ...spells],
    }));
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="@container flex flex-wrap items-center gap-2">
      <UTooltip
        v-for="tile in spellcastingTiles"
        :key="tile.key"
        :text="SPELL_TAB_TEXT.editSpellcasting"
      >
        <button
          type="button"
          :class="SHEET_HEADER_STAT_CLASS"
          :aria-label="tile.ariaLabel"
          @click.left.exact.prevent="openSpellcasting(tile.classId)"
        >
          <span
            v-if="tile.className"
            class="max-w-24 truncate text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ tile.className }}
          </span>

          <span
            v-if="tile.ability"
            class="text-[10px] font-bold tracking-wider text-primary uppercase"
          >
            {{ tile.ability }}
          </span>

          <span class="flex items-center gap-1.5">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
              :title="SPELL_TAB_TEXT.saveDc.full"
            >
              {{ SPELL_TAB_TEXT.saveDc.short }}
            </span>

            <span class="text-xs font-bold text-highlighted">
              {{ tile.saveDc }}
            </span>
          </span>

          <span class="h-5 w-px bg-default/60" />

          <span class="flex items-center gap-1.5">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
              :title="SPELL_TAB_TEXT.attack.full"
            >
              {{ SPELL_TAB_TEXT.attack.short }}
            </span>

            <span class="text-xs font-bold text-highlighted">
              {{ tile.attack }}
            </span>
          </span>
        </button>
      </UTooltip>

      <UTooltip
        v-for="tile in preparedTiles"
        :key="tile.kind"
        :text="tile.hint"
      >
        <button
          type="button"
          :class="SHEET_HEADER_STAT_CLASS"
          :aria-label="tile.hint"
          @click.left.exact.prevent="openPrepared(tile.kind)"
        >
          <span class="flex items-center gap-1.5">
            <UIcon
              :name="tile.icon"
              class="size-4 shrink-0 text-muted @lg:hidden"
            />

            <span
              class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
            >
              {{ tile.label }}
            </span>

            <span
              class="text-xs font-bold"
              :class="tile.valueClass"
            >
              {{ tile.value }}
            </span>
          </span>
        </button>
      </UTooltip>

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          :icon="SHEET_ICON.add"
          :label="SPELL_TAB_TEXT.add"
          color="neutral"
          variant="ghost"
          size="sm"
          class="ml-auto"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <div
      v-if="document.spells.length"
      class="flex flex-wrap items-center gap-x-1.5 gap-y-2"
    >
      <UTooltip :text="SPELL_TAB_TEXT.filterPreparedHint">
        <button
          type="button"
          class="mr-1.5 flex items-center gap-1"
          :class="preparedChipClass"
          :aria-pressed="isPreparedOnly"
          @click.left.exact.prevent="togglePreparedOnly"
        >
          <UIcon
            :name="SPELL_ICON"
            class="size-3.5"
          />

          {{ SPELL_TAB_TEXT.filterPrepared }}
        </button>
      </UTooltip>

      <UTooltip
        v-for="chip in levelChips"
        :key="chip.level"
        :text="chip.hint"
      >
        <button
          type="button"
          :class="chip.chipClass"
          :aria-pressed="chip.isPicked"
          :aria-label="chip.hint"
          @click.left.exact.prevent="toggleLevel(chip.level)"
        >
          {{ chip.label }}
        </button>
      </UTooltip>

      <UButton
        v-if="hasFilter"
        icon="tabler:filter-off"
        :label="SPELL_TAB_TEXT.filterReset"
        color="neutral"
        variant="ghost"
        size="xs"
        class="ml-auto"
        @click.left.exact.prevent="resetFilter"
      />
    </div>

    <div
      v-for="group in groups"
      :key="group.key"
      class="flex flex-col gap-2"
    >
      <div class="flex items-center gap-2">
        <span
          class="shrink-0"
          :class="SHEET_GROUP_LABEL_CLASS"
        >
          {{ group.title }}
        </span>

        <div class="h-px grow bg-default/50" />

        <UTooltip
          v-for="slotGroup in group.slotGroups"
          :key="slotGroup.kind"
          :text="slotGroup.summary"
        >
          <div class="flex shrink-0 items-center gap-1.5">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ slotGroup.label }}
            </span>

            <span class="flex items-center gap-1">
              <button
                v-for="circle in slotGroup.circles"
                :key="circle.index"
                type="button"
                class="relative size-3.5 cursor-pointer rounded-full border transition-colors after:absolute after:-inset-1"
                :class="circle.circleClass"
                :aria-label="circle.label"
                :aria-pressed="circle.isUsed"
                @click.left.exact.prevent="toggleSlot(circle)"
              />
            </span>
          </div>
        </UTooltip>
      </div>

      <SheetSpellRow
        v-for="row in group.rows"
        :key="row.spell.id"
        :spell="row.spell"
        :origin="row.origin"
        :is-prepared="row.isPrepared"
        :is-toggleable="row.isToggleable"
        :toggle-hint="row.toggleHint"
        :tiles="row.tiles"
        :ability-label="row.abilityLabel"
        @toggle-prepared="togglePrepared(row.spell)"
        @preview="openPreview(row.spell)"
        @roll="rollTile(row.spell, $event)"
        @cast="openCast(row.spell)"
        @edit="openEdit(row.spell)"
        @copy="copySpell(row.spell)"
        @ability="openAbility(row.spell)"
        @remove="askRemoveSpell(row.spell)"
      />
    </div>

    <div
      v-if="emptyLabel"
      class="flex h-40 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ emptyLabel }}
    </div>

    <SheetSpellcastingModal
      v-model:open="isSpellcastingOpen"
      :class-id="spellcastingClassId"
    />

    <SheetPreparedSpellsModal
      v-model:open="isPreparedOpen"
      :kind="preparedKind"
    />

    <SheetSpellModal
      v-model:open="isEditOpen"
      :spell="editedSpell"
      @save="saveSpell"
    />

    <SheetSpellAbilityModal
      v-model:open="isAbilityOpen"
      :spell-id="activeSpellId"
    />

    <SheetSpellCastModal
      v-model:open="isCastOpen"
      :spell-id="activeSpellId"
    />

    <SheetCatalogAddModal
      v-model:open="isAddOpen"
      :title="SPELL_ADD_TEXT.title"
      :source="SPELL_CATALOG_SOURCE"
      :taken-urls="spellUrls"
      :taken-label="SPELL_ADD_TEXT.added"
      :loader="loadPickedSpell"
      :preview-type="getPreviewType"
      :preset="catalogPreset"
      @add="addFromCatalog"
    />

    <ContentEntityDrawer
      v-if="previewSpell?.url"
      v-model:open="isPreviewOpen"
      type="spell"
      :path="previewSpell.url"
      :title="previewSpell.name"
    />

    <SheetConfirmModal
      v-model:open="isRemoveOpen"
      :title="removeTitle"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </div>
</template>
