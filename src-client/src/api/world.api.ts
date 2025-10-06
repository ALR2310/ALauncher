import { WorldDto, WorldsQueryDto } from '@shared/dtos/world.dto';

import { API } from '.';

export const findAllWorld = async (payload: WorldsQueryDto) => {
  return API.get<WorldDto[]>('/worlds', { params: payload });
};
