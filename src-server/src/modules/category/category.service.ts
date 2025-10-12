import { CategoryQueryDto } from '@shared/dtos/category.dto';
import { CurseForgeCategory } from 'curseforge-api/v1/Types';

import { curseForgeService } from '../curseforge/curseforge.service';

export const categoriesService = new (class CategoriesService {
  async findAll(payload: CategoryQueryDto): Promise<CurseForgeCategory[]> {
    const categories = await curseForgeService.getCategories(payload);
    return categories.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }
})();
