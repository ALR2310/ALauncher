import { CategoryQueryDto } from '@shared/dtos/category.dto';

import { Controller, Get, Payload, Validate } from '~/common/decorators';

import { categoriesService } from './category.service';

@Controller('/categories')
export class CategoryController {
  @Get()
  @Validate(CategoryQueryDto)
  findAll(@Payload() payload: CategoryQueryDto) {
    return categoriesService.findAll(payload);
  }
}
