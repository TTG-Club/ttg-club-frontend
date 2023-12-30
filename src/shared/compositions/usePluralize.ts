export function usePluralize() {
  const getPlural = (number: number, strings: string[]) => {
    const num = Math.abs(number);

    if (Number.isInteger(num)) {
      const cases = [2, 0, 1, 1, 1, 2];

      return strings[
        number % 100 > 4 && number % 100 < 20
          ? 2
          : cases[number % 10 < 5 ? number % 10 : 5]
      ];
    }

    return strings[1];
  };

  return {
    getPlural
  };
}
