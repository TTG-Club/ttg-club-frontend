import { storeToRefs } from 'pinia';
import { useScroll } from '@vueuse/core';
import {
  computed, readonly, ref, watch
} from 'vue';
import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';
import { useUIStore } from '@/store/UI/UIStore';
import { useAxios } from '@/common/composition/useAxios';

export const useYoutube = () => {
  const http = useAxios();
  const { bodyElement } = storeToRefs(useUIStore());

  const bodyScroll = useScroll(bodyElement, {
    behavior: 'smooth'
  });

  const itemsPerPage = readonly(ref([
    {
      name: 9,
      value: 9
    },
    {
      name: 27,
      value: 27
    },
    {
      name: 54,
      value: 54
    }
  ]));

  const isLoaded = ref(false);

  const page = ref(1);
  const limit = ref(9);

  const count = ref(0);
  const videos = ref<Array<TYoutubeVideo>>([]);

  const pages = computed(() => {
    if (count.value <= limit.value) {
      return 0;
    }

    return Math.ceil(count.value / limit.value);
  });

  const load = async (scrollToTop = true) => {
    try {
      const {
        data, status, statusText
      } = await http.get<{
        count: number;
        list: Array<TYoutubeVideo>
      }>({
        url: '/youtube',
        payload: {
          page: page.value - 1,
          limit: limit.value,
          order: http.getOrders([
            {
              field: 'created',
              direction: 'desc'
            },
            {
              field: 'name',
              direction: 'asc'
            }
          ])
        }
      });

      if (status !== 200) {
        return Promise.reject(statusText);
      }

      count.value = data.count;
      videos.value = data.list;
      isLoaded.value = true;

      if (scrollToTop) {
        bodyScroll.y.value = 0;
      }

      return data.list;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const addList = ref<Array<TYoutubeVideo['id']>>([]);
  const isAdding = (id: TYoutubeVideo['id']) => addList.value.includes(id);

  const add = async (video: TYoutubeVideo) => {
    if (isAdding(video.id)) {
      return Promise.resolve();
    }

    addList.value.push(video.id);

    try {
      const {
        data, status, statusText
      } = await http.post({
        url: '/youtube',
        payload: { video }
      });

      if (status !== 200) {
        return Promise.reject(statusText);
      }

      await load();

      return data;
    } catch (err) {
      return Promise.reject(err);
    } finally {
      addList.value = addList.value.filter(item => item !== video.id);
    }
  };

  const removeList = ref<Array<TYoutubeVideo['id']>>([]);
  const isRemoving = (id: TYoutubeVideo['id']) => removeList.value.includes(id);

  const remove = async (id: TYoutubeVideo['id']) => {
    if (isRemoving(id)) {
      return Promise.resolve();
    }

    removeList.value.push(id);

    try {
      const resp = await http.delete({
        url: '/youtube',
        payload: { id }
      });

      if (resp.status !== 200) {
        return Promise.reject(resp.status);
      }

      return load();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      removeList.value = removeList.value.filter(item => item !== id);
    }
  };

  watch(
    page,
    async () => {
      await load();
    },
    {
      flush: 'post'
    }
  );

  watch(
    limit,
    async () => {
      if (page.value === 1) {
        await load();

        return;
      }

      page.value = 1;
    }
  );

  return {
    isLoaded: readonly(isLoaded),
    isRemoving,
    itemsPerPage,
    limit,
    page,
    pages,
    videos,
    load,
    add,
    remove
  };
};
