/**
 * Список с элементом, переставленным на соседнее место.
 * @param images - адреса картинок
 * @param index - номер переставляемой картинки
 * @param offset - `-1` — на место раньше, `1` — позже
 * @returns новый список или прежний, если двигать некуда
 */
export function moveGalleryImage(
  images: ReadonlyArray<string>,
  index: number,
  offset: -1 | 1,
): Array<string> {
  const target = index + offset;
  const current = images[index];
  const neighbour = images[target];

  if (current === undefined || neighbour === undefined) {
    return [...images];
  }

  return images.map((image, position) => {
    if (position === index) {
      return neighbour;
    }

    return position === target ? current : image;
  });
}

/**
 * Список без картинки с указанным номером.
 * @param images - адреса картинок
 * @param index - номер убираемой картинки
 */
export function removeGalleryImage(
  images: ReadonlyArray<string>,
  index: number,
): Array<string> {
  return images.filter((_image, position) => position !== index);
}
