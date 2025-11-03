import { ROUTES } from '@shared/constants/routes';
import { CategoryClassEnum } from '@shared/enums/general.enum';
import { CurseForgeModLoaderType, CurseForgeModsSearchSortField } from 'curseforge-api';
import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContext } from 'use-context-selector';

import { useVersionReleasesQuery } from '~/hooks/api/useVersionApi';

interface DiscoverContextType {
  // State
  contentId: number | null;
  instanceId: string | undefined;
  sortField: CurseForgeModsSearchSortField;
  searchFilter: string;
  categoryType: CategoryClassEnum;
  gameVersion: string;
  loaderType: CurseForgeModLoaderType;
  categoryIds: Set<number>;
  showAlphaFiles: boolean;
  pageSize: number;
  fileVersion: string;
  fileLoader: CurseForgeModLoaderType;
  fileVersions: string[];
  fileLoaders: string[];
  // Setters
  setContentId: Dispatch<SetStateAction<number | null>>;
  setInstanceId: Dispatch<SetStateAction<string | undefined>>;
  setSortField: Dispatch<SetStateAction<CurseForgeModsSearchSortField>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setCategoryType: Dispatch<SetStateAction<CategoryClassEnum>>;
  setGameVersion: Dispatch<SetStateAction<string>>;
  setLoaderType: Dispatch<SetStateAction<CurseForgeModLoaderType>>;
  setCategoryIds: Dispatch<SetStateAction<Set<number>>>;
  setShowAlphaFiles: Dispatch<SetStateAction<boolean>>;
  setPageSize: Dispatch<SetStateAction<number>>;
  setFileVersion: Dispatch<SetStateAction<string>>;
  setFileLoader: Dispatch<SetStateAction<CurseForgeModLoaderType>>;
  setFileVersions: Dispatch<SetStateAction<string[]>>;
  setFileLoaders: Dispatch<SetStateAction<string[]>>;
}

const DiscoverContext = createContext<DiscoverContextType>(null!);

const DiscoverProvider = ({ children }: { children: ReactNode }) => {
  const debounceRef = useRef<number>(null!);
  const [searchParams, setSearchParams] = useSearchParams();

  // State for filtering
  const [instanceId, setInstanceId] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState(CurseForgeModsSearchSortField.Popularity);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [categoryType, setCategoryType] = useState(CategoryClassEnum.Mods);
  const [gameVersion, setGameVersion] = useState<string>('');
  const [loaderType, setLoaderType] = useState(CurseForgeModLoaderType.Any);
  const [categoryIds, setCategoryIds] = useState<Set<number>>(new Set());
  // State for detail page
  const [contentId, setContentId] = useState<number | null>(null);
  // State for files filtering
  const [fileVersions, setFileVersions] = useState<string[]>([]);
  const [fileVersion, setFileVersion] = useState<string>('');
  const [fileLoaders, setFileLoaders] = useState<string[]>([]);
  const [fileLoader, setFileLoader] = useState(CurseForgeModLoaderType.Any);
  const [showAlphaFiles, setShowAlphaFiles] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(20);

  const { data: versions } = useVersionReleasesQuery();

  // Sync from URL filtering
  useEffect(() => {
    if (location.pathname !== ROUTES.discover.path) return;

    setSortField(Number(searchParams.get('sortField')) || CurseForgeModsSearchSortField.Popularity);
    setCategoryType(Number(searchParams.get('categoryType')) || CategoryClassEnum.Mods);
    setLoaderType(Number(searchParams.get('loaderType')) || CurseForgeModLoaderType.Any);
    setGameVersion(searchParams.get('gameVersion') || '');
    setSearchFilter(searchParams.get('searchFilter') || '');
    setInstanceId(searchParams.get('instance') || undefined);
    setCategoryIds(() => {
      try {
        const raw = searchParams.get('categoryIds');
        return raw ? new Set<number>(JSON.parse(raw)) : new Set<number>();
      } catch {
        return new Set<number>();
      }
    });
  }, [searchParams]);

  // Set default game version
  useEffect(() => {
    if (gameVersion || !versions || !versions.length) return;
    setGameVersion(versions[0].version);
  }, [gameVersion, versions]);

  // Sync to URL filtering
  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      if (location.pathname !== ROUTES.discover.path) return;

      const params: Record<string, string> = {};
      if (sortField) params['sortField'] = String(sortField);
      if (searchFilter) params['searchFilter'] = searchFilter;
      if (categoryType) params['categoryType'] = String(categoryType);
      if (gameVersion) params['gameVersion'] = gameVersion;
      if (loaderType) params['loaderType'] = String(loaderType);
      if (categoryIds.size) params['categoryIds'] = JSON.stringify(Array.from(categoryIds));
      if (instanceId) params['instance'] = instanceId;
      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [categoryIds, categoryType, gameVersion, instanceId, loaderType, searchFilter, setSearchParams, sortField]);

  const value = useMemo<DiscoverContextType>(
    () => ({
      contentId,
      sortField,
      searchFilter,
      categoryType,
      gameVersion,
      loaderType,
      categoryIds,
      instanceId,
      showAlphaFiles,
      pageSize,
      fileVersion,
      fileLoader,
      fileVersions,
      fileLoaders,
      // Setters
      setContentId,
      setSortField,
      setSearchFilter,
      setCategoryType,
      setGameVersion,
      setLoaderType,
      setCategoryIds,
      setInstanceId,
      setShowAlphaFiles,
      setPageSize,
      setFileVersion,
      setFileLoader,
      setFileVersions,
      setFileLoaders,
    }),
    [
      contentId,
      sortField,
      searchFilter,
      categoryType,
      gameVersion,
      loaderType,
      categoryIds,
      instanceId,
      showAlphaFiles,
      pageSize,
      fileVersion,
      fileLoader,
      fileVersions,
      fileLoaders,
    ],
  );

  return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
};

export { DiscoverContext, DiscoverProvider };
