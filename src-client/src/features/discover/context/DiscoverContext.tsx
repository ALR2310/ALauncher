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

  // State for filtering
  const [instanceId, setInstanceId] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState<number>(SORT_FIELD.Featured);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [categoryType, setCategoryType] = useState<number>(CATEGORY_CLASS.Mods);
  const [gameVersion, setGameVersion] = useState<string>('');
  const [loaderType, setLoaderType] = useState<number>(MOD_LOADER.Any);
  const [categoryIds, setCategoryIds] = useState<Set<number>>(new Set());
  // State for detail page
  const [contentId, setContentId] = useState<number | null>(null);
  // State for files filtering
  const [allowAlphaFile, setAllowAlphaFile] = useState<boolean>(true);
  const [pageSizeFile, setPageSizeFile] = useState<number>(20);

  const { data: versions } = useVersionReleasesQuery();

  // Sync from URL
  useEffect(() => {
    if (location.pathname !== ROUTES.discover.path) return;

    setSortField(Number(searchParams.get('sortField')) || SORT_FIELD.Featured);
    setCategoryType(Number(searchParams.get('categoryType')) || CATEGORY_CLASS.Mods);
    setLoaderType(Number(searchParams.get('loaderType')) || MOD_LOADER.Any);
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
    ],
  );

  return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
};

export { DiscoverContext, DiscoverProvider };
