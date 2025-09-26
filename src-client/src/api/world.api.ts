import { WorldDto, WorldsQueryDto } from '@shared/dtos/world.dto';

import { API } from '~/api/api';

export const findAllWorld = async (payload: WorldsQueryDto) => {
  return API.get<WorldDto[]>('/worlds', { params: payload });
};
