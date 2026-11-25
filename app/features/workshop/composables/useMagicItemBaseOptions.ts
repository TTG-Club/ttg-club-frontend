import type { Ref } from 'vue';

import type { SelectOption } from '../model';

import { fetchMagicItemBaseOptions, MAGIC_ITEM_BASE_SECTIONS } from '../model';

/** Возвращаемое значение useMagicItemBaseOptions. */
export interface UseMagicItemBaseOptionsReturn {
  weaponOptions: Ref<Array<SelectOption>>;
  armorOptions: Ref<Array<SelectOption>>;
  isLoading: Ref<boolean>;
}

/**
 * Оружие и доспехи для выбора немагической основы магического предмета.
 * Без списка раздела его выбор просто пуст: основа необязательна.
 */
export function useMagicItemBaseOptions(): UseMagicItemBaseOptionsReturn {
  const weaponOptions = ref<Array<SelectOption>>([]);
  const armorOptions = ref<Array<SelectOption>>([]);
  const isLoading = ref(false);

  onMounted(async () => {
    isLoading.value = true;

    const [weapons, armors] = await Promise.allSettled([
      fetchMagicItemBaseOptions(MAGIC_ITEM_BASE_SECTIONS.weapons),
      fetchMagicItemBaseOptions(MAGIC_ITEM_BASE_SECTIONS.armors),
    ]);

    weaponOptions.value = weapons.status === 'fulfilled' ? weapons.value : [];
    armorOptions.value = armors.status === 'fulfilled' ? armors.value : [];
    isLoading.value = false;
  });

  return { weaponOptions, armorOptions, isLoading };
}
