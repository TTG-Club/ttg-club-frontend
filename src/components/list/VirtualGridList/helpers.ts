export type CheckIsListGridFlatParams = {
  showRightSide: boolean;
  fullscreen: boolean;
};

export const checkIsListGridFlat = (params: CheckIsListGridFlatParams) => {
  const { showRightSide, fullscreen } = params;

  return showRightSide && !fullscreen;
};
