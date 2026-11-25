import type { MaybeRefOrGetter, Ref } from 'vue';
import type { SectionConfig } from '~section/model';

import type { CatalogPickerEntry } from '../model';

import { fetchCatalogPickerEntries } from '../model';

/** Возвращаемое значение useCatalogPickerNames. */
export interface UseCatalogPickerNamesReturn {
  /** Известные записи по адресу: выбранные в окне и догруженные. */
  known: Ref<Record<string, CatalogPickerEntry>>;
  /** Запоминает записи, выбранные в окне. */
  remember: (entries: ReadonlyArray<CatalogPickerEntry>) => void;
}

/**
 * Записи выбранного в поле мастерской по адресу. У записи, открытой из
 * справочника, в поле одни адреса: без догрузки чип показывал бы
 * `chain_mail` вместо «Кольчуга». Раздел догружается одним коротким
 * списком и один раз: адрес, которого в нём нет, так и остаётся адресом.
 * @param section - раздел справочника
 * @param slugs - адреса выбранных записей
 */
export function useCatalogPickerNames(
  section: MaybeRefOrGetter<SectionConfig>,
  slugs: MaybeRefOrGetter<ReadonlyArray<string>>,
): UseCatalogPickerNamesReturn {
  const known = ref<Record<string, CatalogPickerEntry>>({});

  let isRequested = false;

  /** Запоминает записи, выбранные в окне. */
  function remember(entries: ReadonlyArray<CatalogPickerEntry>): void {
    known.value = {
      ...known.value,
      ...Object.fromEntries(entries.map((entry) => [entry.slug, entry])),
    };
  }

  /** Догружает раздел, если среди выбранного есть незнакомые адреса. */
  async function loadMissing(): Promise<void> {
    const hasMissing = toValue(slugs).some((slug) => !known.value[slug]);

    if (isRequested || !hasMissing) {
      return;
    }

    isRequested = true;

    try {
      const entries = await fetchCatalogPickerEntries(toValue(section));

      // Выбранное в окне главнее догруженного: оно новее
      known.value = {
        ...Object.fromEntries(entries.map((entry) => [entry.slug, entry])),
        ...known.value,
      };
    } catch {
      // Список не пришёл — чипы покажут адреса, выбор от этого не страдает
    }
  }

  // Цикла нет: обработчик пишет только в `known`, а повторный запрос
  // отсекает `isRequested`
  watch(() => toValue(slugs), loadMissing, { immediate: true });

  return { known, remember };
}
