import { EObjectTypes } from '@/shared/compositions/useMarkupRender/types/render';

interface IMarkupHeadingBase {
  type: EObjectTypes.HEADING;
  name: string;
  style?:
    | string
    | string[]
    | {
        [key: string]: boolean;
      };
}

interface IMarkupHeadingWithCollapse {
  collapse?: boolean;
  collapsed?: boolean;
}

interface IMarkupHeading3 extends IMarkupHeadingBase {
  level: 3;
  entries?: Array<string>;
}

interface IMarkupHeading2
  extends IMarkupHeadingBase,
    IMarkupHeadingWithCollapse {
  level: 2;
  bg?: boolean;
  colored?: boolean;
  subtitle?: string;
  separator?: boolean;
  entries?: Array<string | IMarkupHeading3>;
}

interface IMarkupHeading1 extends IMarkupHeadingBase {
  level: 1;
  entries?: Array<string | IMarkupHeading2 | IMarkupHeading3>;
}

export type TMarkupHeading =
  | IMarkupHeading1
  | IMarkupHeading2
  | IMarkupHeading3;

const testItem: TMarkupHeading = {
  type: EObjectTypes.HEADING,
  name: 'test',
  level: 2
};

console.log(testItem);

export const useHeadingRender = (obj: TMarkupHeading) => {
  console.log(obj);
};
