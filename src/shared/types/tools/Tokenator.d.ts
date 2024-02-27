export type FrameListItem = {
  url: string | undefined;
  id: number;
};

export type SelectedFrame = {
  url: string | undefined;
  index: number;
};

export type TokenFrames = {
  list: FrameListItem[] | null;
  selected: SelectedFrame;
  show: boolean;
};
