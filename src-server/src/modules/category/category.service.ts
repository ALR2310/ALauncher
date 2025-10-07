import { CategoryQueryDto } from '@shared/dtos/category.dto';
import { CurseForgeCategory } from 'curseforge-api/v1/Types';

import { curseForgeService } from '../curseforge/curseforge.service';

class CategoriesService {
  async findAll(payload: CategoryQueryDto): Promise<CurseForgeCategory[]> {
    const result = await curseForgeService.getCategories(payload);
    let categories = result;

    if (payload.classId === 6) {
      categories = categories.filter((cat: CurseForgeCategory) => cat.id !== 426 && cat.parentCategoryId !== 426);
    }

    return categories.sort((a: CurseForgeCategory, b: CurseForgeCategory) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
    );
  }
}

export const categoriesService = new CategoriesService();
