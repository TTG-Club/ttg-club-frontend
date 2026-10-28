/** Божество в виде формы мастерской: так его отдаёт ручка правки. */
export interface WorkshopGod {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  commitment: string;
  /** Код типа: `MALE`, `PHILOSOPHY`. */
  sex: string;
  /** Код ранга. */
  rank: string;
  /** Код мировоззрения. */
  alignment: string;
  description: string;
  alternativeDescription: string;
  symbol: string;
  nicknames: string;
  /** Коды доменов. */
  domains: Array<string>;
  /** Идентификатор пантеона строкой, как его отдают фильтры. */
  pantheonId: string;
  page: number | null;
  /** Аббревиатура книги-источника. */
  source?: string;
}
