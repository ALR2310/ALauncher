import { CATEGORY_CLASS, MOD_LOADER, SORT_FIELD } from '@shared/constants/curseforge.const';
import { ROUTES } from '@shared/constants/routes';
import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContext } from 'use-context-selector';

import { useVersionReleasesQuery } from '~/hooks/api/useVersionApi';

interface DiscoverContextType {
  // State
  contentId: number | null;
  instanceId: string | undefined;
  sortField: number;
  searchFilter: string;
  categoryType: number;
  gameVersion: string;
  loaderType: number;
  categoryIds: Set<number>;
  allowAlphaFile: boolean;
  pageSizeFile: number;
  // Setters
  setContentId: Dispatch<SetStateAction<number | null>>;
  setInstanceId: Dispatch<SetStateAction<string | undefined>>;
  setSortField: Dispatch<SetStateAction<number>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setCategoryType: Dispatch<SetStateAction<number>>;
  setGameVersion: Dispatch<SetStateAction<string>>;
  setLoaderType: Dispatch<SetStateAction<number>>;
  setCategoryIds: Dispatch<SetStateAction<Set<number>>>;
  setAllowAlphaFile: Dispatch<SetStateAction<boolean>>;
  setPageSizeFile: Dispatch<SetStateAction<number>>;
}

const DiscoverContext = createContext<DiscoverContextType>(null!);

const DiscoverProvider = ({ children }: { children: ReactNode }) => {
  const debounceRef = useRef<number>(null!);
  const [searchParams, setSearchParams] = useSearchParams();

  // Global state for discover filtering
  const [contentId, setContentId] = useState<number | null>(null);
  const [instanceId, setInstanceId] = useState<string | undefined>(searchParams.get('instance') || undefined);
  const [sortField, setSortField] = useState(Number(searchParams.get('sortField')) || SORT_FIELD.Featured);
  const [searchFilter, setSearchFilter] = useState(searchParams.get('searchFilter') || '');
  const [categoryType, setCategoryType] = useState(Number(searchParams.get('categoryType')) || CATEGORY_CLASS.Mods);
  const [gameVersion, setGameVersion] = useState(searchParams.get('gameVersion') || '');
  const [loaderType, setLoaderType] = useState(Number(searchParams.get('loaderType')) || MOD_LOADER.Any);
  const [categoryIds, setCategoryIds] = useState<Set<number>>(() => {
    try {
      const raw = searchParams.get('categoryIds');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  // State for files filtering
  const [allowAlphaFile, setAllowAlphaFile] = useState<boolean>(true);
  const [pageSizeFile, setPageSizeFile] = useState<number>(20);

  const { data: versions } = useVersionReleasesQuery();

  // Set default game version
  useEffect(() => {
    if (gameVersion) return;
    if (!versions || !versions.length) return;
    setGameVersion(versions[0].version);
  }, [gameVersion, versions]);

  // Sync to URL
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
      setSearchParams(params);
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
      allowAlphaFile,
      pageSizeFile,
      setContentId,
      setSortField,
      setSearchFilter,
      setCategoryType,
      setGameVersion,
      setLoaderType,
      setCategoryIds,
      setInstanceId,
      setAllowAlphaFile,
      setPageSizeFile,
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
      allowAlphaFile,
      pageSizeFile,
      setPageSizeFile,
    ],
  );

  return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
};

export { DiscoverContext, DiscoverProvider };
