import { CategoryDto } from '@shared/dtos/category.dto';
import { useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherCategory = () => {
  const findAllCategoryQuery = ({ classId, classesOnly }: { classId?: number; classesOnly?: boolean }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['categories', classId, classesOnly],
      queryFn: async () => {
        const res = await api.get('/categories', { params: { classId, classesOnly } });
        return res.data as CategoryDto[];
      },
    });
  };

  return { findAllCategoryQuery };
};
