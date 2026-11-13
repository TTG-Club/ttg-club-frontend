import type {
  DmScreenPoint,
  DmScreenRect,
  DmScreenSnapAssist,
  DmScreenSnapPickerPosition,
  DmScreenSnapTarget,
} from '../model';

import {
  DM_SCREEN_SNAP_PICKER_DEFAULT_POSITION,
  DM_SCREEN_SNAP_PICKER_STORAGE_KEY,
  dmScreenSnapPickerPositionSchema,
  getDmScreenEdgeTarget,
  getDmScreenZoneRect,
  isDmScreenPickerBand,
} from '../model';
import { useDmScreen } from './useDmScreen';

/**
 * Читает сохранённое место панели раскладок; незнакомое значение — место
 * по умолчанию.
 * @param raw - строка из localStorage
 */
function readPickerPosition(raw: string): DmScreenSnapPickerPosition {
  const parsed = dmScreenSnapPickerPositionSchema.safeParse(raw);

  return parsed.success ? parsed.data : DM_SCREEN_SNAP_PICKER_DEFAULT_POSITION;
}

/**
 * Раскладки окон ширмы, как у окон Windows 11. Пока окно тащат, у бокового
 * края холста оно предлагает занять половину, а у верха или низа (как
 * выбрал пользователь) появляется панель раскладок: окно отпускают над
 * местом в ней. Когда окно встало в
 * раскладку, остальные её места по очереди предлагают выбрать окно — пока
 * места или окна не кончатся.
 */
export const useDmScreenSnap = createSharedComposable(() => {
  const { windows, viewport, update, restore } = useDmScreen();

  /** Окно, которое тащат сейчас. */
  const draggingId = ref<string>();

  const pointer = ref<DmScreenPoint>();

  /** Место в панели раскладок под указателем: его сообщает сама панель. */
  const pickerTarget = shallowRef<DmScreenSnapTarget>();

  const assist = shallowRef<DmScreenSnapAssist>();

  /** Где панель раскладок: выбор пользователя, хранится в браузере. */
  const pickerPosition = useLocalStorage<DmScreenSnapPickerPosition>(
    DM_SCREEN_SNAP_PICKER_STORAGE_KEY,
    DM_SCREEN_SNAP_PICKER_DEFAULT_POSITION,
    {
      serializer: {
        read: readPickerPosition,
        write: (value) => value,
      },
    },
  );

  /**
   * Переносит панель раскладок или прячет её.
   * @param position - где показывать панель
   */
  function setPickerPosition(position: DmScreenSnapPickerPosition): void {
    pickerPosition.value = position;
  }

  const isPickerVisible = computed(
    () =>
      !!draggingId.value
      && !!pointer.value
      && isDmScreenPickerBand(
        pointer.value,
        viewport.value,
        pickerPosition.value,
      ),
  );

  /** Место, которое окно займёт, если его отпустить. */
  const target = computed<DmScreenSnapTarget | undefined>(() => {
    if (!draggingId.value || !pointer.value) {
      return undefined;
    }

    return isPickerVisible.value
      ? pickerTarget.value
      : getDmScreenEdgeTarget(pointer.value, viewport.value);
  });

  const previewRect = computed<DmScreenRect | undefined>(() =>
    target.value
      ? getDmScreenZoneRect(target.value.zone, viewport.value)
      : undefined,
  );

  const assistRect = computed<DmScreenRect | undefined>(() => {
    const [zone] = assist.value?.pending ?? [];

    return zone ? getDmScreenZoneRect(zone, viewport.value) : undefined;
  });

  /** Места, до которых очередь ещё не дошла. */
  const assistPendingRects = computed<Array<DmScreenRect>>(() =>
    (assist.value?.pending ?? [])
      .slice(1)
      .map((zone) => getDmScreenZoneRect(zone, viewport.value)),
  );

  /** Окна, которые ещё можно поставить в раскладку. */
  const assistCandidates = computed(() => {
    const activeAssist = assist.value;

    return activeAssist
      ? windows.value.filter(
          (screenWindow) => !activeAssist.placedIds.includes(screenWindow.id),
        )
      : [];
  });

  /**
   * Уходит ли окно на второй план: идёт подбор, а окно в раскладку ещё не
   * поставлено.
   * @param id - окно
   */
  function isBackground(id: string): boolean {
    return !!assist.value && !assist.value.placedIds.includes(id);
  }

  /**
   * Продолжает подбор со следующего места; без мест или окон подбор
   * заканчивается.
   * @param pending - свободные места
   * @param placedIds - окна, уже стоящие в раскладке
   */
  function continueAssist(
    pending: DmScreenSnapAssist['pending'],
    placedIds: DmScreenSnapAssist['placedIds'],
  ): void {
    const hasCandidates = windows.value.some(
      (screenWindow) => !placedIds.includes(screenWindow.id),
    );

    assist.value =
      pending.length && hasCandidates ? { pending, placedIds } : undefined;
  }

  /**
   * Окно начали тащить: подбор окон в прошлую раскладку заканчивается.
   * @param id - окно
   */
  function startDrag(id: string): void {
    draggingId.value = id;
    assist.value = undefined;
  }

  /**
   * Окно тащат дальше.
   * @param point - где указатель
   */
  function moveDrag(point: DmScreenPoint): void {
    pointer.value = point;
  }

  /**
   * Окно отпустили. Над местом раскладки оно занимает это место, а
   * остальные места начинают подбор окон.
   * @returns место, которое заняло окно, или `undefined`
   */
  function endDrag(): DmScreenRect | undefined {
    const id = draggingId.value;
    const snapped = target.value;
    const rect = previewRect.value;

    draggingId.value = undefined;
    pointer.value = undefined;
    pickerTarget.value = undefined;

    if (!id || !snapped || !rect) {
      return undefined;
    }

    continueAssist(
      snapped.layout.zones.filter((zone) => zone !== snapped.zone),
      [id],
    );

    return rect;
  }

  /**
   * Запоминает место в панели раскладок под указателем.
   * @param next - место или `undefined`, если указатель не над местом
   */
  function setPickerTarget(next?: DmScreenSnapTarget): void {
    pickerTarget.value = next;
  }

  /**
   * Ставит окно в место, которое заполняется сейчас, и переходит к
   * следующему.
   * @param id - окно
   */
  function place(id: string): void {
    const activeAssist = assist.value;
    const rect = assistRect.value;

    if (!activeAssist || !rect) {
      return;
    }

    restore(id);
    update(id, rect);

    continueAssist(activeAssist.pending.slice(1), [
      ...activeAssist.placedIds,
      id,
    ]);
  }

  /** Оставляет место пустым и переходит к следующему. */
  function skip(): void {
    const activeAssist = assist.value;

    if (activeAssist) {
      continueAssist(activeAssist.pending.slice(1), activeAssist.placedIds);
    }
  }

  /** Заканчивает подбор окон. */
  function stopAssist(): void {
    assist.value = undefined;
  }

  return {
    pointer: readonly(pointer),
    target,
    // Не `readonly`: у ссылки на localStorage тип записи шире типа чтения
    // (допускает `null` для удаления ключа), и обёртка отдала бы наружу его
    pickerPosition: computed<DmScreenSnapPickerPosition>(
      () => pickerPosition.value,
    ),
    setPickerPosition,
    isPickerVisible,
    previewRect,
    assistRect,
    assistPendingRects,
    assistCandidates,
    isBackground,
    startDrag,
    moveDrag,
    endDrag,
    setPickerTarget,
    place,
    skip,
    stopAssist,
  };
});
