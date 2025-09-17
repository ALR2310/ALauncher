import { WorldDto, WorldsQueryDto } from '@shared/dtos/world.dto';

import api from '~/configs/axios';

export const findAllWorld = async (payload: WorldsQueryDto) => {
  const res = await api.get('/worlds', { params: payload });
  return res.data as WorldDto[];
};
