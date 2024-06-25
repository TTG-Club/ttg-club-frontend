import { useUIStore } from '@/shared/stores/UIStore';

import { YoutubeApi } from '@/features/youtube/api';
import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

import type { SelectOption } from 'naive-ui';

export const useYoutube = () => {
  const { bodyElement } = storeToRefs(useUIStore());

  const bodyScroll = useScroll(bodyElement, {
    behavior: 'smooth',
  });

  const itemsPerPage: Array<SelectOption> = [
    {
      label: '9',
      value: 9,
    },
    {
      label: '27',
      value: 27,
    },
    {
      label: '54',
      value: 54,
    },
  ];

  const isLoaded = ref(false);

  const page = ref(1);
  const size = ref(9);

  const count = ref(0);
  const videos = ref<Array<TYoutubeVideo>>([]);

  const pages = computed(() => {
    if (count.value <= size.value) {
      return 0;
    }

    return Math.ceil(count.value / size.value);
  });

  const load = async (scrollToTop = true) => {
    try {
      const data = await YoutubeApi.load({
        page: unref(page) - 1,
        size: unref(size),
        order: [
          {
            field: 'created',
            direction: 'desc',
          },
          {
            field: 'name',
            direction: 'asc',
          },
        ],
      });

      count.value = data.total;
      videos.value = data.items;
      isLoaded.value = true;

      if (scrollToTop) {
        bodyScroll.y.value = 0;
      }

      return data.items;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  // Removing
  const removeList = ref<Array<TYoutubeVideo['id']>>([]);
  const isRemoving = (id: TYoutubeVideo['id']) => removeList.value.includes(id);

  const remove = async (id: TYoutubeVideo['id']) => {
    if (isRemoving(id)) {
      return Promise.resolve();
    }

    removeList.value.push(id);

    try {
      await YoutubeApi.remove(id);

      return load();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      removeList.value = removeList.value.filter((item) => item !== id);
    }
  };

  watch(
    page,
    async () => {
      await load();
    },
    {
      flush: 'post',
    },
  );

  watch(size, async () => {
    if (page.value === 1) {
      await load();

      return;
    }

    page.value = 1;
  });

  return {
    isLoaded: readonly(isLoaded),
    isRemoving,
    itemsPerPage,
    size,
    page,
    pages,
    videos,
    load,
    remove,
  };
};
