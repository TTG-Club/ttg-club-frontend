export type CheckIsListGridFlatParams = {
  showRightSide: boolean;
  fullscreen: boolean;
};

export const checkIsListGridFlat = (params: CheckIsListGridFlatParams) => {
  const { showRightSide, fullscreen } = params;

  return showRightSide && !fullscreen;
};

export type GetListGridInTabProps = {
  inTab?: boolean;
};

export const getListGridInTabProps = ({
  showRightSide,
  fullscreen,
  inTab,
}: CheckIsListGridFlatParams & GetListGridInTabProps) => ({
  flat: checkIsListGridFlat({
    showRightSide,
    fullscreen,
  }),
  columns: inTab
    ? {
        base: 2,
        sm: 1,
      }
    : undefined,
});
