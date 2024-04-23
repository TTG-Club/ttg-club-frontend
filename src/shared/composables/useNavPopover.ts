import { ref } from 'vue';

export function useNavPopover() {
  const isShowPopover = ref(false);
  const isShowSearch = ref(false);

  const hidePopovers = () => {
    isShowPopover.value = false;
    isShowSearch.value = false;
  };

  return {
    isShowPopover,
    isShowSearch,
    hidePopovers,
  };
}
