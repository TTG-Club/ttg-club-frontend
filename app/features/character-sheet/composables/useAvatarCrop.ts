import type { ComputedRef, Ref, ShallowRef, WritableComputedRef } from 'vue';

import type { CropArea, CropCorner, CropDirection, ImageSize } from '../model';

import {
  clampCropArea,
  createCroppedImageFile,
  createInitialCropArea,
  CROP_DIRECTION_OFFSETS,
  getMaxCropSize,
  getMinCropSize,
  resizeCropArea,
  resizeCropAreaFromCenter,
  SHEET_AVATAR_CROP,
} from '../model';

/** Положение области над превью в процентах изображения. */
interface CropAreaRatio {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Текущее перетаскивание: откуда и с какой области оно началось. */
interface CropGesture {
  /** Угол, за который тянут; null — область двигают целиком. */
  corner: CropCorner | null;
  pointerX: number;
  pointerY: number;
  area: CropArea;
}

/** Возвращаемое значение useAvatarCrop. */
export interface UseAvatarCropReturn {
  area: Readonly<ShallowRef<CropArea>>;
  areaRatio: ComputedRef<CropAreaRatio>;
  naturalSize: Readonly<ShallowRef<ImageSize | null>>;
  /** Сторона области — значение ползунка. */
  cropSize: WritableComputedRef<number>;
  minSize: ComputedRef<number>;
  maxSize: ComputedRef<number>;
  isReady: ComputedRef<boolean>;
  /** Читает размеры загруженной картинки и ставит начальную область. */
  initialize: () => void;
  startMove: (event: PointerEvent) => void;
  startResize: (event: PointerEvent, corner: CropCorner) => void;
  moveArea: (direction: CropDirection) => void;
  growArea: () => void;
  shrinkArea: () => void;
  /**
   * Вырезает область в файл.
   * @param sourceName - имя исходного файла
   * @returns файл или null, если картинка ещё не готова
   */
  crop: (sourceName: string) => Promise<File | null>;
}

/**
 * Выбор квадратной области на изображении для портрета: перемещение,
 * изменение размера и вырезание результата в файл.
 * @param imageElement - элемент с загруженным изображением
 */
export function useAvatarCrop(
  imageElement: Readonly<Ref<HTMLImageElement | null>>,
): UseAvatarCropReturn {
  const naturalSize = shallowRef<ImageSize | null>(null);
  const area = shallowRef<CropArea>({ x: 0, y: 0, size: 0 });

  // Жест не влияет на разметку — держим его вне реактивности
  let gesture: CropGesture | null = null;

  const { width: previewWidth } = useElementSize(imageElement);

  const isReady = computed(() => Boolean(naturalSize.value));

  /** Отношение превью к исходнику: переводит сдвиг курсора в пиксели. */
  const previewScale = computed(() => {
    const image = naturalSize.value;

    return image && previewWidth.value ? previewWidth.value / image.width : 1;
  });

  const maxSize = computed(() =>
    naturalSize.value ? getMaxCropSize(naturalSize.value) : 0,
  );

  const minSize = computed(() =>
    naturalSize.value ? getMinCropSize(naturalSize.value) : 0,
  );

  const cropSize = computed({
    get: () => area.value.size,
    set: (value: number) => {
      if (naturalSize.value) {
        area.value = resizeCropAreaFromCenter(
          area.value,
          value,
          naturalSize.value,
        );
      }
    },
  });

  const areaRatio = computed<CropAreaRatio>(() => {
    const image = naturalSize.value;

    if (!image) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    return {
      left: (area.value.x / image.width) * 100,
      top: (area.value.y / image.height) * 100,
      width: (area.value.size / image.width) * 100,
      height: (area.value.size / image.height) * 100,
    };
  });

  /**
   * Запоминает начало жеста.
   * @param event - нажатие на область или маркер угла
   * @param corner - угол при изменении размера; null — перемещение
   */
  function startGesture(event: PointerEvent, corner: CropCorner | null): void {
    if (!naturalSize.value) {
      return;
    }

    gesture = {
      corner,
      pointerX: event.clientX,
      pointerY: event.clientY,
      area: area.value,
    };
  }

  function startMove(event: PointerEvent): void {
    startGesture(event, null);
  }

  function startResize(event: PointerEvent, corner: CropCorner): void {
    startGesture(event, corner);
  }

  /**
   * Двигает или растягивает область за курсором.
   * @param event - перемещение курсора
   */
  function handlePointerMove(event: PointerEvent): void {
    const image = naturalSize.value;

    if (!gesture || !image) {
      return;
    }

    const delta = {
      x: (event.clientX - gesture.pointerX) / previewScale.value,
      y: (event.clientY - gesture.pointerY) / previewScale.value,
    };

    area.value = gesture.corner
      ? resizeCropArea(gesture.area, gesture.corner, delta, image)
      : clampCropArea(
          {
            ...gesture.area,
            x: gesture.area.x + delta.x,
            y: gesture.area.y + delta.y,
          },
          image,
        );
  }

  function stopGesture(): void {
    gesture = null;
  }

  // Слушатели на окне: во время перетаскивания курсор уходит за рамку.
  // pointercancel снимает жест, если касание прервали
  useEventListener('pointermove', handlePointerMove);
  useEventListener(['pointerup', 'pointercancel'], stopGesture);

  function moveArea(direction: CropDirection): void {
    const image = naturalSize.value;

    if (!image) {
      return;
    }

    const offset = CROP_DIRECTION_OFFSETS[direction];
    const step = maxSize.value * SHEET_AVATAR_CROP.moveStep;

    area.value = clampCropArea(
      {
        ...area.value,
        x: area.value.x + offset.x * step,
        y: area.value.y + offset.y * step,
      },
      image,
    );
  }

  function growArea(): void {
    cropSize.value =
      area.value.size + maxSize.value * SHEET_AVATAR_CROP.sizeStep;
  }

  function shrinkArea(): void {
    cropSize.value =
      area.value.size - maxSize.value * SHEET_AVATAR_CROP.sizeStep;
  }

  function initialize(): void {
    const element = imageElement.value;

    if (!element?.naturalWidth || !element.naturalHeight) {
      return;
    }

    const image = {
      width: element.naturalWidth,
      height: element.naturalHeight,
    };

    naturalSize.value = image;
    area.value = createInitialCropArea(image);
  }

  async function crop(sourceName: string): Promise<File | null> {
    const element = imageElement.value;

    if (!element || !naturalSize.value) {
      return null;
    }

    return await createCroppedImageFile(element, area.value, sourceName);
  }

  return {
    area: readonly(area),
    areaRatio,
    naturalSize: readonly(naturalSize),
    cropSize,
    minSize,
    maxSize,
    isReady,
    initialize,
    startMove,
    startResize,
    moveArea,
    growArea,
    shrinkArea,
    crop,
  };
}
