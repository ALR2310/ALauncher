import { Category } from '@shared/schemas/category.schema';
import { useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherCategory = () => {
  const categoryQuery = ({ classId, classesOnly }: { classId?: number; classesOnly?: boolean }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['category', classId, classesOnly],
      queryFn: async () => {
        const res = await api.get('/category', { params: { classId, classesOnly } });
        return res.data as Category[];
      },
    });
  };

  return { categoryQuery };
};
