import { ROUTES } from '@shared/constants/routes';
import { ContentDto } from '@shared/dtos/content.dto';
import { CategoryClassEnum, InstanceContentEnum } from '@shared/enums/general.enum';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCcw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import DataTable from '~/components/DataTable';
import { DiscoverContext } from '~/context/DiscoverContext';
import { useInstanceGetContentsQuery, useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

import LibraryDetailHeader from './components/LibraryDetailHeader';
import { OnDeleteProps, OnToggleProps, useLibraryTableColumns } from './hooks/useLibraryTableColumns';

const tabs = [
  CategoryClassEnum.Mods,
  CategoryClassEnum['Resource Packs'],
  CategoryClassEnum['Shader Packs'],
  CategoryClassEnum['Data Packs'],
  CategoryClassEnum.Worlds,
];

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(CategoryClassEnum.Mods);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const contentType = useMemo(
    () => CategoryClassEnum[tab].replace(/\s+/g, '').toLowerCase() as InstanceContentEnum,
    [tab],
  );

  const { data: instance, isLoading: isLoadingInstance } = useInstanceOneQuery(id!);
  const { data: contents, isLoading } = useInstanceGetContentsQuery({ id: id!, contentType });

  const setGameVersion = useContextSelector(DiscoverContext, (v) => v.setGameVersion);
  const setCategoryType = useContextSelector(DiscoverContext, (v) => v.setCategoryType);
  const setLoaderType = useContextSelector(DiscoverContext, (v) => v.setLoaderType);
  const setSearchFilter = useContextSelector(DiscoverContext, (v) => v.setSearchFilter);
  const setInstanceId = useContextSelector(DiscoverContext, (v) => v.setInstanceId);
  const setFileVersion = useContextSelector(DiscoverContext, (v) => v.setFileVersion);
  const setFileLoader = useContextSelector(DiscoverContext, (v) => v.setFileLoader);
  const [localData, setLocalData] = useState<ContentDto[]>(contents?.data || []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return localData;

    const query = searchQuery.toLowerCase().trim();
    return localData.filter((content) => {
      return content.name?.toLowerCase().includes(query) || content.description?.toLowerCase().includes(query);
    });
  }, [localData, searchQuery]);

  // Sync contents data to local state when contentType or contents change
  useEffect(() => {
    if (contents?.data !== undefined) {
      setLocalData(contents.data);
    }
  }, [contents?.data, contentType]);

  useEffect(() => {
    if (instance) {
      setInstanceId(instance.id);
      setGameVersion(instance.version);
      setSearchFilter('');
      setCategoryType(tab);
      setLoaderType(instance.loader ? instance.loader.type : 0);
      setFileVersion(instance.version);
      setFileLoader(instance.loader ? instance.loader.type : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, tab]);

  // Cleanup: Invalidate queries when leaving component to refresh data on return
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['instances'] });
    };
  }, [queryClient]);

  const handleToggle = useCallback(({ contentIds, enable, error }: OnToggleProps) => {
    if (error) {
      setLocalData((prevData) =>
        prevData.map((content) => {
          if (contentIds.includes(content.id)) {
            return {
              ...content,
              instance: content.instance ? { ...content.instance, enabled: !enable } : content.instance,
            };
          }
          return content;
        }),
      );
    } else {
      setLocalData((prevData) =>
        prevData.map((content) => {
          if (contentIds.includes(content.id)) {
            return {
              ...content,
              instance: content.instance ? { ...content.instance, enabled: enable } : content.instance,
            };
          }
          return content;
        }),
      );
    }
  }, []);

  const handleDelete = useCallback(
    ({ contentIds, error }: OnDeleteProps) => {
      if (error) {
        if (contents?.data) {
          const deletedItems = contents.data.filter((content) => contentIds.includes(content.id));
          setLocalData((prevData) => [...prevData, ...deletedItems]);
        }
      } else setLocalData((prevData) => prevData.filter((content) => !contentIds.includes(content.id)));
    },
    [contents?.data],
  );

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['contents'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const tableColumns = useLibraryTableColumns({
    data: localData,
    contentType,
    onToggle: handleToggle,
    onDelete: handleDelete,
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
      {/* Header */}
      <LibraryDetailHeader data={instance} isLoading={isLoadingInstance} />

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0 gap-2">
        <div className="tabs tabs-border tabs-border-success flex-nowrap overflow-x-auto">
          {tabs.map((t) => (
            <input
              key={t}
              type="radio"
              name="content_type"
              className={`tab`}
              aria-label={`${CategoryClassEnum[t]}${tab === t ? ` (${localData.length})` : ''}`}
              onChange={() => setTab(t)}
              defaultChecked={t === tab}
            />
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <div
            className={`flex transition-all duration-300 ease-in-out origin-right ${
              showSearch ? 'w-auto opacity-100' : 'w-0 opacity-0 pointer-events-none'
            }`}
          >
            {showSearch && (
              <input
                type="search"
                placeholder="Search..."
                className="input input-sm animate-slideIn"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <button
            className="btn btn-sm btn-soft btn-square"
            onClick={() => {
              if (showSearch) {
                setShowSearch(false);
                setSearchQuery('');
              } else {
                setShowSearch(true);
              }
            }}
          >
            <Search size={20} />
          </button>

          <Link to={ROUTES.discover.path} className="btn btn-soft btn-sm btn-success">
            <Plus size={20}></Plus>Add Content
          </Link>

          <button className="btn btn-soft btn-sm btn-square" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCcw
              size={16}
              className={isRefreshing ? 'animate-spin' : ''}
              style={isRefreshing ? { animationDirection: 'reverse' } : {}}
            />
          </button>
        </div>

        <DataTable
          className="flex-1 bg-base-100 rounded-xl"
          size="sm"
          columns={tableColumns}
          isLoading={isLoading}
          loadingCount={6}
          data={filteredData}
          onSortChange={(key, dir) => console.log('Sort changed:', key, dir)}
          emptyState={
            <>
              No contents found.{' '}
              <Link to={ROUTES.discover.path} className="link hover:link-success">
                Add now
              </Link>
            </>
          }
        />
      </div>
    </div>
  );
}
