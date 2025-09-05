import { Category } from '@shared/types/category.type';

import { curseForgeService } from '../curseforge/curseforge.service';

class CategoriesService {
  async findAll(classId?: number, classesOnly = false): Promise<Category[]> {
    const result = await curseForgeService.getCategories(432, classId, classesOnly);
    let categories = result.data;

    if (classId === 6) {
      categories = categories.filter((cat: any) => cat.id !== 426 && cat.parentCategoryId !== 426);
    }

    return categories.sort((a: any, b: any) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }
}

export const categoriesService = new CategoriesService();
