import {
  LoaderQueryDto,
  ReleaseNoteDetailsDto,
  ReleaseNoteQueryDto,
  ReleaseNoteResponseDto,
  VersionDto,
} from '@shared/dtos/version.dto';

import { API } from '.';

const BASE_PATH = 'versions';

export const versionReleases = () => {
  return API.get<VersionDto[]>(`${BASE_PATH}/releases`);
};

export const versionLoaders = (params: LoaderQueryDto) => {
  return API.get<VersionDto[]>(`${BASE_PATH}/loaders`, params);
};

export const versionNotes = (params: ReleaseNoteQueryDto) => {
  return API.get<ReleaseNoteResponseDto>(`${BASE_PATH}/notes`, params);
};

export const versionNoteDetail = (version: string) => {
  return API.get<ReleaseNoteDetailsDto>(`${BASE_PATH}/notes/${version}`);
};
