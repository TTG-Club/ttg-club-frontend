import type { Ref } from 'vue';

import type { YoutubeVideo } from '../../model';

import { getApiErrorMessage } from '~user/model';

import {
  ADMIN_YOUTUBE_ICON,
  ADMIN_YOUTUBE_TEXT,
  canToggleVideo,
  deleteYoutubeVideo,
  fetchActiveYoutubeCount,
  fetchYoutubeVideos,
  getPageCount,
  setYoutubeVideoActive,
  YOUTUBE_ACTIVE_LIMIT,
  YOUTUBE_DEFAULT_PAGE_SIZE,
} from '../../model';

/** Возвращаемое значение useAdminYoutube. */
export interface UseAdminYoutubeReturn {
  /** Текущая страница, с единицы. */
  page: Ref<number>;
  /** Роликов на странице. */
  pageSize: Ref<number>;
  videos: Ref<Array<YoutubeVideo>>;
  total: Ref<number>;
  pageCount: Ref<number>;
  /** Сколько роликов на главной. */
  activeCount: Ref<number>;
  isLoading: Ref<boolean>;
  loadError: Ref<boolean>;
  /** Перечитывает список и счётчик главной. */
  load: () => Promise<void>;
  /** Можно ли сейчас переключить показ ролика. */
  canToggle: (video: YoutubeVideo) => boolean;
  /** Включает или выключает ролик на главной. */
  toggleActive: (video: YoutubeVideo, isActive: boolean) => Promise<void>;
  /** Удаляет ролик. */
  remove: (video: YoutubeVideo) => Promise<boolean>;
  /** Идёт ли действие над роликом. */
  isBusy: (videoId: string) => boolean;
}

/** Список роликов канала для админки: страницы, показ на главной, удаление. */
export function useAdminYoutube(): UseAdminYoutubeReturn {
  const toast = useToast();

  const page = ref(1);
  const pageSize = ref(YOUTUBE_DEFAULT_PAGE_SIZE);
  const videos = ref<Array<YoutubeVideo>>([]);
  const total = ref(0);
  const activeCount = ref(0);
  const isLoading = ref(false);
  const loadError = ref(false);
  const busyIds = ref<Set<string>>(new Set());

  const pageCount = computed(() => getPageCount(total.value, pageSize.value));

  function notifyError(error: unknown): void {
    toast.add({
      title: ADMIN_YOUTUBE_TEXT.actionError,
      description: getApiErrorMessage(error, '') || undefined,
      color: 'error',
      icon: ADMIN_YOUTUBE_ICON.error,
    });
  }

  function setBusy(videoId: string, value: boolean): void {
    const next = new Set(busyIds.value);

    if (value) {
      next.add(videoId);
    } else {
      next.delete(videoId);
    }

    busyIds.value = next;
  }

  async function load(): Promise<void> {
    isLoading.value = true;
    loadError.value = false;

    try {
      const [videoPage, count] = await Promise.all([
        fetchYoutubeVideos(page.value - 1, pageSize.value),
        fetchActiveYoutubeCount(),
      ]);

      videos.value = videoPage.items;
      total.value = videoPage.total;
      activeCount.value = count;

      // Удалили последний ролик на последней странице: уходим на предыдущую
      if (!videoPage.items.length && page.value > 1) {
        page.value = Math.max(1, pageCount.value);
      }
    } catch {
      loadError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function canToggle(video: YoutubeVideo): boolean {
    return canToggleVideo(
      video.active,
      activeCount.value,
      YOUTUBE_ACTIVE_LIMIT,
    );
  }

  async function toggleActive(
    video: YoutubeVideo,
    isActive: boolean,
  ): Promise<void> {
    if (isActive && !canToggle(video)) {
      toast.add({
        title: ADMIN_YOUTUBE_TEXT.activeLimitReached,
        color: 'warning',
      });

      return;
    }

    setBusy(video.id, true);

    try {
      await setYoutubeVideoActive(video.id, isActive);
      await load();
    } catch (error) {
      notifyError(error);
    } finally {
      setBusy(video.id, false);
    }
  }

  async function remove(video: YoutubeVideo): Promise<boolean> {
    setBusy(video.id, true);

    try {
      await deleteYoutubeVideo(video.id);

      toast.add({
        title: ADMIN_YOUTUBE_TEXT.deletedToast,
        color: 'success',
        icon: ADMIN_YOUTUBE_ICON.success,
      });

      await load();

      return true;
    } catch (error) {
      notifyError(error);

      return false;
    } finally {
      setBusy(video.id, false);
    }
  }

  function isBusy(videoId: string): boolean {
    return busyIds.value.has(videoId);
  }

  // Смена размера возвращает на первую страницу; если она уже первая,
  // список перечитывается сам: вотчер страницы в этом случае не сработает
  watch(pageSize, () => {
    if (page.value === 1) {
      void load();
    } else {
      page.value = 1;
    }
  });

  watch(page, () => {
    void load();
  });

  return {
    page,
    pageSize,
    videos,
    total,
    pageCount,
    activeCount,
    isLoading,
    loadError,
    load,
    canToggle,
    toggleActive,
    remove,
    isBusy,
  };
}
