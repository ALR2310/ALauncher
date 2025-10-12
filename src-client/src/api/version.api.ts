import { LoaderQueryDto, ReleaseNoteDetailsDto, ReleaseNoteDto, VersionDto } from '@shared/dtos/version.dto';

import { API } from '.';

const BASE_PATH = 'versions';

export const versionReleases = () => {
  return API.get<VersionDto[]>(`${BASE_PATH}/release`);
};

export const versionLoaders = (params: LoaderQueryDto) => {
  return API.get<VersionDto[]>(`${BASE_PATH}/loader`, params);
};

export const versionNotes = () => {
  return API.get<ReleaseNoteDto[]>(`${BASE_PATH}/notes`);
};

export const versionNoteDetail = (version: string) => {
  return API.get<ReleaseNoteDetailsDto>(`${BASE_PATH}/notes/${version}`);
};
