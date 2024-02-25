import { ref } from 'vue';

const isOpen = ref(true);

function toggle() {
  isOpen.value = !isOpen.value;
}

export const useDiceHistory = () => ({ isOpen, toggle });
