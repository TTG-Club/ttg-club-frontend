import {
  computed, readonly, ref
} from 'vue';
import type { MaybeRef } from '@vueuse/core';
import { toValue } from '@vueuse/shared';
import { useToast } from 'vue-toastification';
import { useAxios } from '@/common/composition/useAxios';
import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';
import { ToastEventBus } from '@/common/utils/ToastConfig';

export const useYoutubeActive = (limit: MaybeRef<number> = 5) => {
  const http = useAxios();
  const { error } = useToast(ToastEventBus);

  const count = ref<number>(0);
  const _limit = readonly(ref(toValue(limit)));
  const isSuccess = computed(() => count.value <= _limit.value);
  const isDisabled = (active: TYoutubeVideo['active']) => !active && count.value >= _limit.value;
  const isLoaded = ref(false);

  const updateCount = async () => {
    try {
      const {
        data, status, statusText
      } = await http.get<number>({
        url: `/youtube/count`,
        payload: { active: true }
      });

      if (status !== 200) {
        return Promise.reject(statusText);
      }

      count.value = data;
      isLoaded.value = true;

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const activate = async (id: TYoutubeVideo['id']) => {
    if (count.value + 1 > _limit.value) {
      error('Максимально количество достигнуто');

      return Promise.reject(new Error('Too many active elements'));
    }

    try {
      await http.patch({ url: `/youtube/active?id=${ id }&activeStatus=${ true }` });

      return updateCount();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const deactivate = async (id: TYoutubeVideo['id']) => {
    try {
      await http.patch({ url: `/youtube/active?id=${ id }&activeStatus=${ false }` });

      return updateCount();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const updateActiveStatus = (id: TYoutubeVideo['id'], status: MaybeRef<boolean>) => {
    const _status = toValue(status);

    if (_status) {
      return activate(id);
    }

    return deactivate(id);
  };

  return {
    limit: _limit,
    count: readonly(count),
    isDisabled,
    isSuccess,
    isLoaded,
    updateCount,
    updateActiveStatus,
    activate,
    deactivate
  };
};
