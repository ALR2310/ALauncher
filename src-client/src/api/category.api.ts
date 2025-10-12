import { CategoryQueryDto } from '@shared/dtos/category.dto';
import { CurseForgeCategory } from 'curseforge-api/v1/Types';

import { API } from '.';

const BASE_PATH = 'categories';

export const categoryFindAll = async (params: CategoryQueryDto) => {
  return API.get<CurseForgeCategory[]>(`${BASE_PATH}`, params);
};
