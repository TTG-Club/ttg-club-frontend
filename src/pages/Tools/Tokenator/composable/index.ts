import { useFetch, useFileDialog, useObjectUrl } from '@vueuse/core';
import { useClamp } from '@vueuse/math';
import { ref, unref } from 'vue';

import { toast } from '@/shared/helpers/toast';

const DEFAULT_SCALE = 1.1;

const scaleConfig = {
  max: 2,
  min: 0.1,
  step: 0.07
};

const SVG_SIZE = 512;
const MAX_SIZE = 50;
const MAX_DIMENSION = 8064;

const file = ref<string>();
const scale = useClamp(DEFAULT_SCALE, scaleConfig.min, scaleConfig.max);
const token = ref<HTMLElement>();
const reflectImage = ref<boolean>(false);
const centerImage = ref<boolean>(false);

export const useTokenator = () => {
  const border = ref();
  const background = ref();

  const { open, onChange } = useFileDialog();

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

  const checkFile = (fileItem: File | null | undefined): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!fileItem) {
        reject(new Error('Упс, что-то пошло не так.'));

        return;
      }

      if (!fileItem?.type.includes('image')) {
        reject(new Error('Токенатор поддерживает только изображения.'));

        return;
      }

      const img = new Image();
      const url = useObjectUrl(fileItem);

      if (!url.value) {
        reject(new Error('Упс, что-то пошло не так.'));

        return;
      }

      img.src = url.value;

      img.onload = () => {
        const fileSize = fileItem.size / 1024 ** 2;

        if (fileSize >= MAX_SIZE) {
          reject(new Error('Размер файла больше допустимого.'));

          return;
        }

        if (img.height > MAX_DIMENSION || img.width > MAX_DIMENSION) {
          reject(new Error('Ширина или высота файла выше допустимого.'));

          return;
        }

        resolve();
      };
    });

  const processFile = async (fileItem: File | null | undefined) => {
    try {
      await checkFile(fileItem);

      file.value = await getBase64(fileItem!);

      resetScale();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }

      console.error(err);
    }
  };

  onChange((param: FileList | null) => processFile(param?.[0] as File));

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

    MAX_SIZE,
    MAX_DIMENSION,
    SVG_SIZE,
    scaleConfig,
    scale,
    file,
    reflectImage,
    centerImage,
    getBase64,
    processFile,
    load,
    open: () =>
      open({
        accept: 'image/*',
        multiple: false
      }),
    reset: () => {
      file.value = undefined;

      resetScale();
    }
  };
};
