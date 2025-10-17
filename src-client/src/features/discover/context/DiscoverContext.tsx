import { CATEGORY_CLASS, MOD_LOADER, SORT_FIELD } from '@shared/constants/curseforge.const';
import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContext } from 'use-context-selector';

import { ROUTES } from '~/constants/routes';
import { useVersionReleasesQuery } from '~/hooks/api/useVersionApi';

interface DiscoverContextType {
  // State
  instance: string | undefined;
  sortField: number;
  searchFilter: string;
  categoryType: number;
  gameVersion: string;
  loaderType: number;
  categoryIds: Set<number>;

  // Setters
  setInstance: Dispatch<SetStateAction<string | undefined>>;
  setSortField: Dispatch<SetStateAction<number>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setCategoryType: Dispatch<SetStateAction<number>>;
  setGameVersion: Dispatch<SetStateAction<string>>;
  setLoaderType: Dispatch<SetStateAction<number>>;
  setCategoryIds: Dispatch<SetStateAction<Set<number>>>;
}

const DiscoverContext = createContext<DiscoverContextType>(null!);

const DiscoverProvider = ({ children }: { children: ReactNode }) => {
  const debounceRef = useRef<number>(null!);
  const [searchParams, setSearchParams] = useSearchParams();

  const [instance, setInstance] = useState<string | undefined>(searchParams.get('instance') || undefined);
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
      if (!location.pathname.startsWith(ROUTES.DISCOVER)) return;

      const params: Record<string, string> = {};
      if (sortField) params['sortField'] = String(sortField);
      if (searchFilter) params['searchFilter'] = searchFilter;
      if (categoryType) params['categoryType'] = String(categoryType);
      if (gameVersion) params['gameVersion'] = gameVersion;
      if (loaderType) params['loaderType'] = String(loaderType);
      if (categoryIds.size) params['categoryIds'] = JSON.stringify(Array.from(categoryIds));
      if (instance) params['instance'] = instance;
      setSearchParams(params);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [categoryIds, categoryType, gameVersion, instance, loaderType, searchFilter, setSearchParams, sortField]);

  const value = useMemo<DiscoverContextType>(
    () => ({
      sortField,
      searchFilter,
      categoryType,
      gameVersion,
      loaderType,
      categoryIds,
      instance,
      setSortField,
      setSearchFilter,
      setCategoryType,
      setGameVersion,
      setLoaderType,
      setCategoryIds,
      setInstance,
    }),
    [sortField, searchFilter, categoryType, gameVersion, loaderType, categoryIds, instance],
  );

  return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
};

export { DiscoverContext, DiscoverProvider };
