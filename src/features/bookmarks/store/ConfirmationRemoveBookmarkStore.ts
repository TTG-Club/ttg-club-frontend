import { defineStore } from 'pinia';

export const useConfirmationRemoveBookmarkStore = defineStore(
  'ConfirmationRemoveBookmarkStore',
  {
    state: () => ({
      dontAskAgain: false
    }),
    persist: true
  }
);
