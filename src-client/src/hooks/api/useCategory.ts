import { useQuery } from '@tanstack/react-query';

import { findAllCategory } from '~/api/category.api';

export function useFindAllCategoryQuery(params: { classId: number; classesOnly?: boolean }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => findAllCategory(params),
  });
}
