import { Category, CategoryQuery, categoryQuerySchema } from '@shared/schemas/category.schema';

import { Validate } from '~s/common/decorators/validate.decorator';

import { curseForgeService } from '../curseforge/curseforge.service';

class CategoriesService {
  @Validate(categoryQuerySchema)
  async findAll(payload: CategoryQuery): Promise<Category[]> {
    const { classId, classesOnly } = payload;
    const result = await curseForgeService.getCategories(432, classId, classesOnly);
    let categories = result.data;

    if (classId === 6) {
      categories = categories.filter((cat: any) => cat.id !== 426 && cat.parentCategoryId !== 426);
    }

    return categories.sort((a: any, b: any) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }
}

export const categoriesService = new CategoriesService();
