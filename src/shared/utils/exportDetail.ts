import { type MaybeRef, unref } from 'vue';
import { useToast } from 'vue-toastification';

import { ToastEventBus } from '@/shared/config';
import { downloadByUrl } from '@/shared/utils/download';
import { getBaseUrl } from '@/shared/utils/getApiUrl';

interface UseDetailExport {
  platform: 'fvtt' | 'lss';
  type: 'spell' | 'bestiary';
  id: number;
  version?: number;
  errorMessage?: string;
}

export const detailExport = (options: MaybeRef<UseDetailExport>) => {
  const toast = useToast(ToastEventBus);

  const { type, platform, id, version, errorMessage } = unref(options);

  let url = `${getBaseUrl()}/${platform}/${type}?id=${id}`;

  if (version) {
    url += `&version=V${version}`;
  }

  downloadByUrl(url).catch((err) => {
    toast.error(errorMessage || 'Произошла ошибка...');

    console.error(err);
  });
};
