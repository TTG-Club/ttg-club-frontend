<script setup lang="ts">
  import type {
    CatalogOption,
    CatalogSearchSource,
    ProficiencyCatalogGroup,
    SheetProficiencyGroup,
    SheetToolProficiency,
  } from '../model';

  import { uniq } from 'es-toolkit';

  import { useCatalogSearch, useCharacterSheet } from '../composables';
  import {
    addToolProficiency,
    ARMOR_PROFICIENCY_GROUPS,
    LANGUAGE_PROFICIENCY_GROUPS,
    normalizeProficiencyName,
    PROFICIENCY_MODAL_TEXT,
    SHEET_ICON,
    TOOL_SEARCH,
    WEAPON_PROFICIENCY_GROUPS,
    WEAPON_SEARCH,
  } from '../model';

  /**
   * Владения группы, как окна владений на new.ttg.club: чекбоксы групп
   * справочника (доспехи, группы оружия, языки), поиск отдельного оружия и
   * инструментов в справочнике и свои записи. Выданное источниками отмечено
   * и не снимается: его забирает только снятие источника.
   */
  const { group } = defineProps<{
    group: SheetProficiencyGroup | null;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  /** Настройка окна группы. */
  interface ModalConfig {
    title: string;
    groups: ReadonlyArray<ProficiencyCatalogGroup>;
    search: CatalogSearchSource | null;
    isCustomAllowed: boolean;
  }

  const CONFIGS: Record<SheetProficiencyGroup, ModalConfig> = {
    armor: {
      title: PROFICIENCY_MODAL_TEXT.armorTitle,
      groups: ARMOR_PROFICIENCY_GROUPS,
      search: null,
      isCustomAllowed: false,
    },
    weapons: {
      title: PROFICIENCY_MODAL_TEXT.weaponsTitle,
      groups: WEAPON_PROFICIENCY_GROUPS,
      search: WEAPON_SEARCH,
      isCustomAllowed: true,
    },
    tools: {
      title: PROFICIENCY_MODAL_TEXT.toolsTitle,
      groups: [],
      search: TOOL_SEARCH,
      isCustomAllowed: true,
    },
    languages: {
      title: PROFICIENCY_MODAL_TEXT.languagesTitle,
      groups: LANGUAGE_PROFICIENCY_GROUPS,
      search: null,
      isCustomAllowed: true,
    },
  };

  const config = computed(() => (group ? CONFIGS[group] : CONFIGS.armor));

  const searchTitle = computed(() =>
    group === 'tools'
      ? PROFICIENCY_MODAL_TEXT.toolSearch
      : PROFICIENCY_MODAL_TEXT.weaponSearch,
  );

  const { searchTerm, options, isLoading, reset } = useCatalogSearch(
    () => config.value.search ?? WEAPON_SEARCH,
  );

  /** Отмеченные записи справочника (по исходному названию). */
  const selected = ref(new Set<string>());

  /** Свои записи вне чекбоксов. */
  const entries = ref<Array<SheetToolProficiency>>([]);

  const customName = ref('');

  /** Записи чекбоксов по нормализованному названию. */
  const catalogByKey = computed(
    () =>
      new Map(
        config.value.groups.flatMap((catalogGroup) =>
          catalogGroup.items.map((name): [string, string] => [
            normalizeProficiencyName(name),
            name,
          ]),
        ),
      ),
  );

  /** Выданное источниками без повторов. */
  const grantedNames = computed(() => {
    const key = group;

    return key
      ? uniq(document.value.proficiencyGrants.flatMap((grant) => grant[key]))
      : [];
  });

  /** Выданное источниками, нормализованные названия. */
  const grantedKeys = computed(
    () => new Set(grantedNames.value.map(normalizeProficiencyName)),
  );

  /**
   * Свои записи группы на листе с адресами справочника.
   * @param key - группа владений
   */
  function getManualEntries(
    key: SheetProficiencyGroup,
  ): Array<SheetToolProficiency> {
    return key === 'tools'
      ? document.value.proficiencies.tools
      : document.value.proficiencies[key].map((name) => ({ name, url: null }));
  }

  // Черновик заново снимается с листа при каждом открытии окна
  watch(isOpen, (opened) => {
    if (!opened) {
      reset();
      customName.value = '';

      return;
    }

    if (!group) {
      return;
    }

    const nextSelected = new Set<string>();
    const nextEntries: Array<SheetToolProficiency> = [];

    for (const entry of getManualEntries(group)) {
      const catalogName = catalogByKey.value.get(
        normalizeProficiencyName(entry.name),
      );

      if (catalogName) {
        nextSelected.add(catalogName);
      } else {
        nextEntries.push(entry);
      }
    }

    selected.value = nextSelected;
    entries.value = nextEntries;
  });

  const displayGroups = computed(() =>
    config.value.groups.map((catalogGroup) => ({
      title: catalogGroup.title,
      items: catalogGroup.items.map((name) => {
        const isGranted = grantedKeys.value.has(normalizeProficiencyName(name));

        return {
          name,
          isGranted,
          isChecked: isGranted || selected.value.has(name),
          description: isGranted ? PROFICIENCY_MODAL_TEXT.granted : undefined,
        };
      }),
    })),
  );

  /** Выданное источниками вне чекбоксов: показывается справкой. */
  const grantedOther = computed(() =>
    grantedNames.value.filter(
      (name) => !catalogByKey.value.has(normalizeProficiencyName(name)),
    ),
  );

  const isSearchEmpty = computed(
    () =>
      Boolean(searchTerm.value.trim())
      && !isLoading.value
      && !options.value.length,
  );

  const isAddDisabled = computed(() => !customName.value.trim());

  /**
   * Отмечает или снимает запись справочника.
   * @param name - запись
   */
  function toggle(name: string): void {
    const next = new Set(selected.value);

    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }

    selected.value = next;
  }

  /**
   * Добавляет запись: название из чекбоксов отмечает чекбокс, иначе запись
   * ложится в свои без повторов.
   * @param entry - название и адрес справочника
   */
  function addEntry(entry: SheetToolProficiency): void {
    const catalogName = catalogByKey.value.get(
      normalizeProficiencyName(entry.name),
    );

    if (catalogName) {
      selected.value = new Set([...selected.value, catalogName]);

      return;
    }

    entries.value = addToolProficiency(entries.value, entry);
  }

  /**
   * Добавляет найденную запись справочника.
   * @param option - запись поиска
   */
  function pickOption(option: CatalogOption): void {
    addEntry({ name: option.name, url: option.url });
    searchTerm.value = '';
  }

  function addCustom(): void {
    const name = customName.value.trim();

    if (!name) {
      return;
    }

    addEntry({ name, url: null });
    customName.value = '';
  }

  /**
   * Убирает свою запись.
   * @param name - название записи
   */
  function removeEntry(name: string): void {
    entries.value = entries.value.filter((entry) => entry.name !== name);
  }

  function apply(): void {
    const key = group;

    if (!key) {
      return;
    }

    const fromCatalog = config.value.groups.flatMap((catalogGroup) =>
      catalogGroup.items.filter((name) => selected.value.has(name)),
    );

    const custom = [...entries.value];

    update((current) => {
      const proficiencies = { ...current.proficiencies };

      if (key === 'tools') {
        proficiencies.tools = [
          ...fromCatalog.map((name) => ({ name, url: null })),
          ...custom,
        ];
      } else {
        proficiencies[key] = [
          ...fromCatalog,
          ...custom.map((entry) => entry.name),
        ];
      }

      return { ...current, proficiencies };
    });

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="config.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div
          v-if="displayGroups.length"
          class="grid grid-cols-1 gap-3"
          :class="{ 'sm:grid-cols-2': displayGroups.length > 1 }"
        >
          <div
            v-for="catalogGroup in displayGroups"
            :key="catalogGroup.title"
            class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="border-b border-default/50 pb-2 text-center text-xs font-bold tracking-wider text-primary uppercase"
            >
              {{ catalogGroup.title }}
            </span>

            <UCheckbox
              v-for="row in catalogGroup.items"
              :key="row.name"
              :model-value="row.isChecked"
              :disabled="row.isGranted"
              :label="row.name"
              :description="row.description"
              @update:model-value="toggle(row.name)"
            />
          </div>
        </div>

        <div
          v-if="grantedOther.length"
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span class="text-xs font-bold tracking-wider text-primary uppercase">
            {{ PROFICIENCY_MODAL_TEXT.granted }}
          </span>

          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="name in grantedOther"
              :key="name"
              :label="name"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </div>
        </div>

        <div
          v-if="config.search"
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span class="text-xs font-bold tracking-wider text-primary uppercase">
            {{ searchTitle }}
          </span>

          <UInput
            v-model="searchTerm"
            :placeholder="PROFICIENCY_MODAL_TEXT.searchHint"
            :icon="SHEET_ICON.search"
            :loading="isLoading"
            class="w-full"
          />

          <ul
            v-if="options.length"
            class="flex max-h-60 flex-col gap-1 overflow-y-auto"
          >
            <li
              v-for="option in options"
              :key="option.url"
            >
              <button
                type="button"
                class="flex w-full flex-col items-start rounded-lg px-3 py-1.5 text-left hover:bg-elevated"
                @click.left.exact.prevent="pickOption(option)"
              >
                <span class="text-sm text-highlighted">{{ option.name }}</span>

                <span
                  v-if="option.caption"
                  class="text-xs text-muted"
                >
                  {{ option.caption }}
                </span>
              </button>
            </li>
          </ul>

          <span
            v-else-if="isSearchEmpty"
            class="text-xs text-dimmed italic"
          >
            {{ PROFICIENCY_MODAL_TEXT.nothingFound }}
          </span>
        </div>

        <div
          v-if="config.isCustomAllowed"
          class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
        >
          <span class="text-xs font-bold tracking-wider text-primary uppercase">
            {{ PROFICIENCY_MODAL_TEXT.custom }}
          </span>

          <div class="flex items-center gap-2">
            <UInput
              v-model="customName"
              class="min-w-0 grow"
              :placeholder="PROFICIENCY_MODAL_TEXT.customPlaceholder"
              :aria-label="PROFICIENCY_MODAL_TEXT.customPlaceholder"
              @keydown.enter.prevent="addCustom"
            />

            <UButton
              icon="tabler:plus"
              :label="PROFICIENCY_MODAL_TEXT.add"
              color="neutral"
              variant="subtle"
              :disabled="isAddDisabled"
              @click.left.exact.prevent="addCustom"
            />
          </div>

          <div
            v-if="entries.length"
            class="flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="entry in entries"
              :key="entry.name"
              :label="entry.name"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              <template #trailing>
                <UButton
                  icon="tabler:x"
                  color="error"
                  variant="ghost"
                  size="xs"
                  square
                  :aria-label="`${PROFICIENCY_MODAL_TEXT.remove}: ${entry.name}`"
                  @click.left.exact.prevent="removeEntry(entry.name)"
                />
              </template>
            </UBadge>
          </div>

          <span
            v-else
            class="text-xs text-dimmed italic"
          >
            {{ PROFICIENCY_MODAL_TEXT.customEmpty }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="PROFICIENCY_MODAL_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="PROFICIENCY_MODAL_TEXT.apply"
          color="primary"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
