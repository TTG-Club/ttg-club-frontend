import {
  createFormulaContext,
  getGrantedProficiencyLists,
  getPendingChoices,
  getSheetStats,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Итоги открытого листа с механикой, эффектами и истощением — одна точка
 * для всех панелей: КД, спасброски, навыки, скорости, защиты, максимум хитов.
 */
export const useSheetStats = createSharedComposable(() => {
  const { document } = useCharacterSheet();

  const stats = computed(() => getSheetStats(document.value));

  /** Значения листа для формул ресурсов: от характеристик с эффектами. */
  const formulaContext = computed(() => ({
    ...createFormulaContext(document.value, stats.value.abilities),
    proficiencyBonus: stats.value.proficiencyBonus,
  }));

  const grantedProficiencies = computed(() =>
    getGrantedProficiencyLists(document.value.proficiencyGrants),
  );

  const pendingChoices = computed(() => getPendingChoices(document.value));

  return { stats, formulaContext, grantedProficiencies, pendingChoices };
});
