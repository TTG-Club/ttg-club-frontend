import type { TokenFormat, TokenOffset } from '../model';

import { z } from 'zod';

import {
  clampTokenScale,
  getCenteredOffset,
  getTokenImageError,
  rescaleTokenOffset,
  TOKEN_FILE_NAME,
  TOKEN_IMAGE,
  TOKEN_SCALE,
  TOKEN_SIZE,
  TOKENATOR_TEXT,
} from '../model';

const blobSchema = z.instanceof(Blob);

/**
 * Загружает картинку оформления как Blob: в SVG для скачивания она должна
 * быть встроена, ссылку холст не подгрузит.
 * @param url - адрес картинки
 */
async function fetchBlob(url: string): Promise<Blob> {
  return blobSchema.parse(await $fetch(url, { responseType: 'blob' }));
}

/**
 * Ширина и высота картинки из файла.
 * @param file - файл картинки
 */
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);

  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();

    image.addEventListener('load', () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight }),
    );

    image.addEventListener('error', () =>
      reject(new Error(TOKENATOR_TEXT.broken)),
    );

    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/**
 * Рисует SVG токена на холсте и отдаёт картинку нужного формата.
 * @param svg - SVG токена со встроенными картинками
 * @param format - формат картинки
 * @returns data URL готовой картинки
 */
function renderToken(svg: SVGSVGElement, format: TokenFormat): Promise<string> {
  const markup = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([markup], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return new Promise<string>((resolve, reject) => {
    const image = new Image(TOKEN_SIZE, TOKEN_SIZE);

    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas');

      canvas.width = TOKEN_SIZE;
      canvas.height = TOKEN_SIZE;
      canvas.getContext('2d')?.drawImage(image, 0, 0, TOKEN_SIZE, TOKEN_SIZE);

      resolve(canvas.toDataURL(`image/${format}`, 1));
    });

    image.addEventListener('error', () =>
      reject(new Error(TOKENATOR_TEXT.broken)),
    );

    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/**
 * Сохраняет картинку как файл.
 * @param url - data URL картинки
 * @param name - имя файла
 */
function saveFile(url: string, name: string): void {
  const link = document.createElement('a');

  link.href = url;
  link.download = name;
  link.click();
}

/**
 * Состояние токенатора: картинка, её масштаб и положение, оформление и
 * скачивание. Общее для настроек и самого токена, пока они на странице.
 */
export const useTokenator = createSharedComposable(() => {
  const toast = useToast();

  const file = shallowRef<File>();
  const scale = ref<number>(TOKEN_SCALE.initial);
  const offset = ref<TokenOffset>(getCenteredOffset(TOKEN_SCALE.initial));
  const isMirrored = ref(false);

  /** SVG токена, его отдаёт `TokenatorStamp`. */
  const token = shallowRef<SVGSVGElement>();

  const backgroundBlob = shallowRef<Blob>();
  const borderBlob = shallowRef<Blob>();

  const { base64: image } = useBase64(file);
  const { base64: background } = useBase64(backgroundBlob);
  const { base64: border } = useBase64(borderBlob);

  const hasImage = computed(() => !!file.value);

  const { open: openDialog, onChange } = useFileDialog({
    accept: 'image/*',
    multiple: false,
  });

  /**
   * Меняет масштаб, не сдвигая центр картинки.
   * @param value - новый масштаб
   */
  function setScale(value: number): void {
    const next = clampTokenScale(value);

    offset.value = rescaleTokenOffset(offset.value, scale.value, next);
    scale.value = next;
  }

  /** Ставит картинку по центру токена. */
  function center(): void {
    offset.value = getCenteredOffset(scale.value);
  }

  function toggleMirror(): void {
    isMirrored.value = !isMirrored.value;
  }

  /**
   * Проверяет и ставит в токен новую картинку.
   * @param selected - выбранный или брошенный файл
   */
  async function loadFile(selected: File | null | undefined): Promise<void> {
    if (!selected) {
      return;
    }

    try {
      const size = selected.type.startsWith('image/')
        ? await readImageSize(selected)
        : { width: 0, height: 0 };

      const error = getTokenImageError({
        type: selected.type,
        size: selected.size,
        ...size,
      });

      if (error) {
        toast.add({ title: error, color: 'error' });

        return;
      }

      file.value = selected;
      scale.value = TOKEN_SCALE.initial;
      isMirrored.value = false;
      center();
    } catch {
      toast.add({ title: TOKENATOR_TEXT.broken, color: 'error' });
    }
  }

  onChange((files) => loadFile(files?.item(0)));

  function open(): void {
    openDialog();
  }

  /**
   * Скачивает токен картинкой.
   * @param format - формат файла
   */
  async function download(format: TokenFormat): Promise<void> {
    if (!token.value || !hasImage.value) {
      return;
    }

    try {
      saveFile(
        await renderToken(token.value, format),
        `${TOKEN_FILE_NAME}.${format}`,
      );
    } catch {
      toast.add({ title: TOKENATOR_TEXT.broken, color: 'error' });
    }
  }

  fetchBlob(TOKEN_IMAGE.background)
    .then((blob) => {
      backgroundBlob.value = blob;
    })
    .catch(() => undefined);

  fetchBlob(TOKEN_IMAGE.border)
    .then((blob) => {
      borderBlob.value = blob;
    })
    .catch(() => undefined);

  return {
    token,
    image,
    background,
    border,
    hasImage,
    scale,
    offset,
    isMirrored,
    setScale,
    center,
    toggleMirror,
    loadFile,
    open,
    download,
  };
});
