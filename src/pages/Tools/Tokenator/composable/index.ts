import { useFetch, useObjectUrl } from '@vueuse/core';
import { useFileDialog } from '@vueuse/core/index';
import { ref, unref } from 'vue';
import { useToast } from 'vue-toastification';

import { ToastEventBus } from '@/core/configs/ToastConfig';

const DEFAULT_SCALE = 1.1;
const SVG_SIZE = 512;
const MAX_SIZE = 50;
const MAX_DIMENSION = 2000;

const file = ref<string>();
const scale = ref<number>(DEFAULT_SCALE);
const token = ref<SVGElement>();

export const useTokenator = () => {
  const border = ref();
  const background = ref();

  const { open, onChange } = useFileDialog();
  const toast = useToast(ToastEventBus);

  const resetScale = () => {
    scale.value = DEFAULT_SCALE;
  };

  const getBase64 = (blob?: Blob): Promise<string | undefined> =>
    new Promise((resolve, reject) => {
      if (!blob) {
        resolve('');

        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject();

          return;
        }

        resolve(reader.result);
      };

      reader.onerror = error => reject(error);

      reader.readAsDataURL(blob);
    });

  const showError = (fileItem: File): Promise<boolean> =>
    new Promise(resolve => {
      const img = new Image();
      const url = useObjectUrl(fileItem);

      if (!url.value) {
        toast.error('Упс, что-то пошло не так.');
        resolve(true);

        return;
      }

      img.src = url.value;

      img.onload = () => {
        const fileSize = fileItem.size / 1024 ** 2;

        if (fileSize >= MAX_SIZE) {
          toast.error('Размер файла больше допустимого.');
          resolve(true);

          return;
        }

        if (img.height > MAX_DIMENSION || img.width > MAX_DIMENSION) {
          toast.error('Ширина или высота файла выше допустимого.');
          resolve(true);

          return;
        }

        resolve(false);
      };
    });

  onChange(async (param: FileList | null) => {
    const fileItem = param?.[0] as File;

    if (await showError(fileItem)) return;

    file.value = await getBase64(fileItem);

    resetScale();
  });

  useFetch('/img/token/token-border.webp', {
    refetch: true,
    async afterFetch(ctx) {
      border.value = await getBase64(ctx.data);

      return ctx;
    }
  }).blob();

  useFetch('/img/token/token-bg.webp', {
    refetch: true,
    async afterFetch(ctx) {
      background.value = await getBase64(ctx.data);

      return ctx;
    }
  }).blob();

  const load = (format: 'webp' | 'png' = 'png'): Promise<void> =>
    new Promise((resolve, reject) => {
      const svg = unref(token);

      if (!svg) {
        reject(new Error('no token provided'));

        return;
      }

      const svgText = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');

      canvas.width = SVG_SIZE;
      canvas.height = SVG_SIZE;

      const context = canvas.getContext('2d');
      const img = new Image();

      img.width = SVG_SIZE;
      img.height = SVG_SIZE;
      img.src = `data:image/svg+xml;base64,${btoa(svgText)}`;

      img.onload = () => {
        context?.drawImage(img, 0, 0, SVG_SIZE, SVG_SIZE);

        const a = document.createElement('a');

        a.href = canvas.toDataURL(`image/${format}`, 1);
        a.download = `token.${format}`;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);

        resolve();
      };

      img.onerror = e => reject(e);
    });

  return {
    token,
    border,
    background,

    SVG_SIZE,
    scale,
    file,

    getBase64,
    open: () =>
      open({
        accept: 'image/*',
        multiple: false
      }),
    reset: () => {
      file.value = undefined;

      resetScale();
    },
    load
  };
};
