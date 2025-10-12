import { LoaderQueryDto } from '@shared/dtos/version.dto';
import { useQuery } from '@tanstack/react-query';

import { versionLoaders, versionNoteDetail, versionNotes, versionReleases } from '~/api/version.api';

export const useVersionReleasesQuery = () => {
  return useQuery({
    queryKey: ['versionReleases'],
    queryFn: () => versionReleases(),
  });
};

export const useVersionLoadersQuery = (params: LoaderQueryDto) => {
  return useQuery({
    queryKey: ['versionLoaders', params],
    queryFn: () => versionLoaders(params),
  });
};

export const useVersionNotesQuery = () => {
  return useQuery({
    queryKey: ['versionNotes'],
    queryFn: () => versionNotes(),
  });
};

export const useVersionNoteDetailQuery = (version: string) => {
  return useQuery({
    queryKey: ['versionNoteDetail', version],
    queryFn: () => versionNoteDetail(version),
  });
};
