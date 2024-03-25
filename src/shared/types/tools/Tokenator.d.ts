export type FrameListItem = {
  id: number;
  name: string;
  type: string;
  url: string | undefined;
  userId: number;
};

export type TokenFrames = {
  list: FrameListItem[] | null;
  selectedFrame: FrameListItem | null;
  selectedFrameIndex: number | undefined;
  show: boolean;
};
