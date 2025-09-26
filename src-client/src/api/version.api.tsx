import { LoaderDto, ReleaseNoteDto, ReleaseNoteQueryDto, VersionDto } from '@shared/dtos/version.dto';

import { API } from './api';

const BASE_URL = '/versions';

export async function findAllVersion() {
  return API.get<VersionDto[]>(`${BASE_URL}`);
}

export async function findReleaseVersion() {
  return API.get<VersionDto[]>(`${BASE_URL}/releases`);
}

export async function findLoaderVersion(params: LoaderDto) {
  return API.get<VersionDto[]>(`${BASE_URL}/loaders`, params);
}

export async function findReleaseNotes(params: ReleaseNoteQueryDto) {
  return API.get<ReleaseNoteDto[]>(`${BASE_URL}/releases/notes`, params);
}
