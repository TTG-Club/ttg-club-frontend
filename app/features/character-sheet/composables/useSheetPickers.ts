/**
 * Окна выбора, которые рисует шапка листа, а открывать нужно и из вкладок:
 * например, предысторию выбирают и с вкладки личности.
 */
export const useSheetPickers = createSharedComposable(() => {
  const isBackgroundPickerOpen = ref(false);

  return { isBackgroundPickerOpen };
});
