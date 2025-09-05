export interface Category {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  url: string;
  iconUrl: string;
  dateModified: string;
  classId?: number;
  parentCategoryId?: number;
  isClass?: boolean;
  displayIndex?: number;
}
