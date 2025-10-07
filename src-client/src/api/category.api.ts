import { CurseForgeCategory } from 'curseforge-api/v1/Types';

import { API } from '.';

const BASE_URL = '/categories';

export async function findAllCategory(params: { classId: number; classesOnly?: boolean }) {
  return API.get<CurseForgeCategory[]>(BASE_URL, params);
}
