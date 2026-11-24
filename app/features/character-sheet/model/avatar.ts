import type { SheetDocument } from './schema';
import type { CropArea, CropCorner, ImageSize } from './types';

import { clamp } from 'es-toolkit';

import {
  CROP_CORNER_EDGES,
  SHEET_AVATAR_CROP,
  SHEET_AVATAR_LIMIT,
} from './constants';

/**
 * Сторона наибольшего квадрата, который влезает в изображение.
 * @param image - размеры изображения
 */
export function getMaxCropSize(image: ImageSize): number {
  return Math.min(image.width, image.height);
}

/**
 * Наименьшая сторона области: минимум или вся картинка, если она мельче.
 * @param image - размеры изображения
 */
export function getMinCropSize(image: ImageSize): number {
  return Math.min(SHEET_AVATAR_LIMIT.minCropSide, getMaxCropSize(image));
}

/**
 * Прижимает область к границам изображения: сторона в допустимых пределах,
 * сама область целиком внутри картинки.
 * @param area - область выбора
 * @param image - размеры изображения
 */
export function clampCropArea(area: CropArea, image: ImageSize): CropArea {
  const size = clamp(area.size, getMinCropSize(image), getMaxCropSize(image));

  return {
    size,
    x: clamp(area.x, 0, image.width - size),
    y: clamp(area.y, 0, image.height - size),
  };
}

/**
 * Начальная область — наибольший квадрат по центру.
 * @param image - размеры изображения
 */
export function createInitialCropArea(image: ImageSize): CropArea {
  const size = getMaxCropSize(image);

  return {
    size,
    x: (image.width - size) / 2,
    y: (image.height - size) / 2,
  };
}

/**
 * Область после перетаскивания угла: противоположный угол стоит на месте,
 * сторона меняется на больший из сдвигов — область остаётся квадратной.
 * @param start - область на момент нажатия
 * @param corner - угол, за который тянут
 * @param delta - сдвиг курсора в пикселях исходника
 * @param delta.x - по горизонтали
 * @param delta.y - по вертикали
 * @param image - размеры изображения
 */
export function resizeCropArea(
  start: CropArea,
  corner: CropCorner,
  delta: { x: number; y: number },
  image: ImageSize,
): CropArea {
  const { isLeft, isTop } = CROP_CORNER_EDGES[corner];
  const right = start.x + start.size;
  const bottom = start.y + start.size;

  const growth = Math.max(
    isLeft ? -delta.x : delta.x,
    isTop ? -delta.y : delta.y,
  );

  // Дальше неподвижного угла область не растёт: там край картинки
  const maxSize = Math.min(
    isLeft ? right : image.width - start.x,
    isTop ? bottom : image.height - start.y,
  );

  const size = clamp(
    start.size + growth,
    Math.min(SHEET_AVATAR_LIMIT.minCropSide, maxSize),
    maxSize,
  );

  return clampCropArea(
    {
      size,
      x: isLeft ? right - size : start.x,
      y: isTop ? bottom - size : start.y,
    },
    image,
  );
}

/**
 * Меняет сторону области, оставляя центр на месте (ползунок, колесо).
 * @param area - область выбора
 * @param size - желаемая сторона
 * @param image - размеры изображения
 */
export function resizeCropAreaFromCenter(
  area: CropArea,
  size: number,
  image: ImageSize,
): CropArea {
  // Сторону ограничиваем до расчёта отступов, иначе центр съедет
  const nextSize = clamp(size, getMinCropSize(image), getMaxCropSize(image));
  const centerX = area.x + area.size / 2;
  const centerY = area.y + area.size / 2;

  return clampCropArea(
    { size: nextSize, x: centerX - nextSize / 2, y: centerY - nextSize / 2 },
    image,
  );
}

/**
 * Имя файла результата: имя исходника с расширением по типу результата.
 * @param sourceName - имя исходного файла
 * @param type - mime-тип результата
 */
export function getCroppedFileName(sourceName: string, type: string): string {
  const extension =
    type.split('/').at(1) ?? SHEET_AVATAR_CROP.fallbackExtension;

  const dotIndex = sourceName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? sourceName.slice(0, dotIndex) : sourceName;

  return `${baseName.trim() || SHEET_AVATAR_CROP.fallbackName}.${extension}`;
}

/**
 * Вырезает область в новый файл. Сторона результата не больше предела, а
 * мелкая область не растягивается.
 * @param image - загруженное изображение
 * @param area - выбранная область
 * @param sourceName - имя исходного файла
 */
export async function createCroppedImageFile(
  image: HTMLImageElement,
  area: CropArea,
  sourceName: string,
): Promise<File> {
  const side = Math.round(
    Math.min(area.size, SHEET_AVATAR_LIMIT.maxOutputSide),
  );

  const canvas = document.createElement('canvas');

  canvas.width = side;
  canvas.height = side;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2d context is not available');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  context.drawImage(
    image,
    area.x,
    area.y,
    area.size,
    area.size,
    0,
    0,
    side,
    side,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      resolve,
      SHEET_AVATAR_CROP.outputType,
      SHEET_AVATAR_CROP.outputQuality,
    );
  });

  if (!blob) {
    throw new Error('Canvas encoding failed');
  }

  return new File([blob], getCroppedFileName(sourceName, blob.type), {
    type: blob.type,
  });
}

/**
 * Файл больше, чем примет сервер.
 * @param file - выбранный файл
 */
export function isSheetAvatarTooLarge(file: File): boolean {
  return file.size > SHEET_AVATAR_LIMIT.maxBytes;
}

/**
 * Документ без портрета: файл принадлежит листу-источнику, поэтому импорт,
 * экспорт и копия не делят его с другим листом.
 * @param document - документ листа
 */
export function withoutSheetAvatar(document: SheetDocument): SheetDocument {
  return document.avatarUrl ? { ...document, avatarUrl: null } : document;
}
