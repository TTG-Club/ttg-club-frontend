const isShowPopover = ref(false);
const isShowSearch = ref(false);

export function useNavPopover() {
  const openPopover = () => {
    isShowPopover.value = true;
  };

  const closePopover = () => {
    isShowPopover.value = false;
  };

  const closeSearch = () => {
    isShowSearch.value = false;
  };

  const openSearch = () => {
    isShowSearch.value = true;
  };

  const toggleSearch = () => {
    isShowSearch.value = !isShowSearch.value;
  };

  const togglePopover = () => {
    isShowPopover.value = !isShowPopover.value;
  };

  return {
    isShowPopover,
    isShowSearch,
    openPopover,
    openSearch,
    closePopover,
    closeSearch,
    togglePopover,
    toggleSearch,
  };
}
