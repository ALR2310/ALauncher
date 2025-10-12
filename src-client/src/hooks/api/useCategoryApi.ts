import { CategoryQueryDto } from '@shared/dtos/category.dto';
import { useQuery } from '@tanstack/react-query';

import { categoryFindAll } from '~/api/category.api';

export function useCategoryQuery(params: CategoryQueryDto) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryFindAll(params),
  });
}
