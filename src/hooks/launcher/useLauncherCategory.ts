import { Category } from '@shared/types/category.type';
import { useMutation } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherCategory = () => {
  const categoryMutation = useMutation({
    mutationFn: async ({ classId, classesOnly }: { classId?: number; classesOnly?: boolean }) => {
      const res = await api.get('/category', { params: { classId, classesOnly } });
      return res.data as Category[];
    },
  });

  return { categoryMutation };
};
