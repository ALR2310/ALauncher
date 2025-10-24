import { CATEGORY_CLASS } from '@shared/constants/curseforge.const';
import { ROUTES } from '@shared/constants/routes';
import { ContentDto } from '@shared/dtos/content.dto';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import DataTable from '~/components/DataTable';
import { useInstanceGetContentsQuery, useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

import { DiscoverContext } from '../discover/context/DiscoverContext';
import LibraryDetailHeader from './components/LibraryDetailHeader';
import { OnDeleteProps, OnToggleProps, useLibraryTableColumns } from './hooks/useLibraryTableColumns';

const tabs = Object.entries(CATEGORY_CLASS)
  .slice(0, 5)
  .map(([title, value], index) => ({
    key: title.replace(/\s+/g, '').toLowerCase(),
    title,
    value,
    checked: index === 0,
  }));

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('mods');
  const { data: instance, isLoading: isLoadingInstance } = useInstanceOneQuery(id!);
  const { data: contents, isLoading } = useInstanceGetContentsQuery({ id: id!, contentType: tab as any });
  const setGameVersion = useContextSelector(DiscoverContext, (v) => v.setGameVersion);
  const setCategoryType = useContextSelector(DiscoverContext, (v) => v.setCategoryType);
  const setLoaderType = useContextSelector(DiscoverContext, (v) => v.setLoaderType);
  const setInstanceId = useContextSelector(DiscoverContext, (v) => v.setInstanceId);
  const [localData, setLocalData] = useState<ContentDto[]>(contents?.data || []);

  // Sync contents data to local state
  useEffect(() => {
    if (contents?.data) setLocalData(contents.data);
  }, [contents?.data]);

  useEffect(() => {
    if (instance) {
      setInstanceId(instance.id);
      setGameVersion(instance.version);
      setCategoryType(tabs.find((t) => t.key === tab)?.value ?? CATEGORY_CLASS.Mods);
      setLoaderType(instance.loader ? instance.loader.type : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, tab]);

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

  const tableColumns = useLibraryTableColumns({
    data: localData,
    contentType: tab as any,
    onToggle: handleToggle,
    onDelete: handleDelete,
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
      {/* Header */}
      <LibraryDetailHeader data={instance} isLoading={isLoadingInstance} />

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0 gap-1">
        <div className="tabs tabs-border tabs-border-success flex-nowrap overflow-x-auto">
          {tabs.map((t) => (
            <input
              key={t.key}
              type="radio"
              name="content_type"
              className={`tab`}
              aria-label={`${t.title}${tab === t.key ? ` (${localData.length})` : ''}`}
              onChange={() => setTab(t.key)}
              defaultChecked={t.checked}
            />
          ))}
        </div>

        <DataTable
          className="flex-1 bg-base-100 rounded-xl"
          size="sm"
          columns={tableColumns}
          isLoading={isLoading}
          loadingCount={6}
          data={localData}
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
