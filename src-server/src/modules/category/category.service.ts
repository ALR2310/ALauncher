import { CategoryQueryDto } from '@shared/dtos/category.dto';
import { CurseForgeCategory } from 'curseforge-api/v1/Types';

import { curseForgeService } from '../curseforge/curseforge.service';

export const categoriesService = new (class CategoriesService {
  async findAll(payload: CategoryQueryDto): Promise<CurseForgeCategory[]> {
    const { classId } = payload;
    const result = await curseForgeService.getCategories(payload);
    let categories = result;

    if (classId === 6) {
      categories = categories.filter((cat) => cat.id !== 426 && cat.parentCategoryId !== 426);
    }

    return categories.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }
})();
