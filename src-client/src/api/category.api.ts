import { CategoryDto } from '@shared/dtos/category.dto';

import { API } from './api';

const BASE_URL = '/categories';

export async function findAllCategory(params: { classId: number; classesOnly?: boolean }) {
  return API.get<CategoryDto[]>(BASE_URL, params);
}
