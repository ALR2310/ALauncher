import { ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { createContext } from 'use-context-selector';

export interface ContentContextType {
  // Filter states from URL params
  sortField: string;
  searchFilter: string;
  categoryType: string;
  gameVersion: string;
  loaderType: string;
  categoryIds: Set<number>;
  instanceId: string | null;

  // Filter handlers
  setSortField: (value: string) => void;
  setSearchFilter: (value: string) => void;
  setCategoryType: (value: string) => void;
  setGameVersion: (value: string) => void;
  setLoaderType: (value: string) => void;
  setCategoryIds: (value: Set<number>) => void;
  handleCategoryChange: (categoryId: number, checked: boolean) => void;
}

const ContentContext = createContext<ContentContextType>(null!);

function ContentProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get instanceId from URL (read-only)
  const instanceId = searchParams.get('instanceId');

  // Filter states synced with URL params
  const [sortField, setSortField] = useState(searchParams.get('sortField') || '2');
  const [searchFilter, setSearchFilter] = useState(searchParams.get('searchFilter') || '');
  const [categoryType, setCategoryType] = useState(searchParams.get('categoryType') || 'mc-mods');
  const [gameVersion, setGameVersion] = useState(searchParams.get('gameVersion') || '');
  const [loaderType, setLoaderType] = useState(searchParams.get('loaderType') || '0');
  const [categoryIds, setCategoryIds] = useState<Set<number>>(() => {
    const raw = searchParams.get('categoryIds');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });

  // Sync state changes with URL params
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    // Keep instanceId if exists
    if (instanceId) next.set('instanceId', instanceId);

    // Set filter params
    next.set('sortField', sortField);
    next.set('searchFilter', searchFilter);
    next.set('categoryType', categoryType);
    if (gameVersion) next.set('gameVersion', gameVersion);
    next.set('loaderType', loaderType);

    if (categoryIds.size > 0) {
      next.set('categoryIds', JSON.stringify([...categoryIds]));
    } else {
      next.delete('categoryIds');
    }

    setSearchParams(next);
  }, [
    sortField,
    searchFilter,
    categoryType,
    gameVersion,
    loaderType,
    categoryIds,
    instanceId,
    searchParams,
    setSearchParams,
  ]);

  // Handle category checkbox change
  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const newSelected = new Set(categoryIds);

    if (checked) {
      newSelected.add(categoryId);
    } else {
      newSelected.delete(categoryId);
    }

    setCategoryIds(newSelected);
  };

  const value: ContentContextType = {
    // Filter states
    sortField,
    searchFilter,
    categoryType,
    gameVersion,
    loaderType,
    categoryIds,
    instanceId,

    // Filter handlers
    setSortField,
    setSearchFilter,
    setCategoryType,
    setGameVersion,
    setLoaderType,
    setCategoryIds,
    handleCategoryChange,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export { ContentContext, ContentProvider };
