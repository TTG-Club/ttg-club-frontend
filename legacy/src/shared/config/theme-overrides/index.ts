import { useUIStore } from '@/shared/stores/UIStore';

import { dark } from './dark';
import { light } from './light';

export const themeOverrides = computed(() => {
  const uiStore = useUIStore();
  const { theme } = storeToRefs(uiStore);
  const themes = { dark, light };

  return themes[theme.value];
});
