export const getCSSPropertyValue = (element: Element, property: string) => {
  const style = window.getComputedStyle(element);
  const value = style.getPropertyValue(property);

  return {
    style,
    value,
  };
};

export const cssValueToNumber = (value: string): number => {
  const containsNumber = /\d+/.test(value);

  if (!containsNumber) {
    throw new Error(`CSS value has no digits in it: ${value}`);
  }

  const numberString = value.replace(/[^0-9.]/g, '');

  return parseFloat(numberString);
};

export const asyncAnimationFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
