import { CATEGORY_CLASS } from '@shared/constants/curseforge.const';
import { ROUTES } from '@shared/constants/routes';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import DataTable from '~/components/DataTable';
import { useInstanceGetContentsQuery, useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

import { DiscoverContext } from '../discover/context/DiscoverContext';
import LibraryDetailHeader from './components/LibraryDetailHeader';
import { useLibraryTableColumns } from './hooks/useLibraryTableColumns';

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

  useEffect(() => {
    if (instance) {
      setInstanceId(instance.id);
      setGameVersion(instance.version);
      setCategoryType(tabs.find((t) => t.key === tab)?.value ?? CATEGORY_CLASS.Mods);
      setLoaderType(instance.loader ? instance.loader.type : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, tab]);

  const tableColumns = useLibraryTableColumns({ contents });

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
      {/* Header */}
      <LibraryDetailHeader data={instance} isLoading={isLoadingInstance} />

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0 gap-1">
        <div className="tabs tabs-border tabs-border-success flex-nowrap overflow-x-auto">
          {tabs.map((tab) => (
            <input
              key={tab.key}
              type="radio"
              name="content_type"
              className={`tab`}
              aria-label={tab.title}
              onChange={() => setTab(tab.key)}
              defaultChecked={tab.checked}
            />
          ))}
        </div>

        <DataTable
          className="flex-1 bg-base-100 rounded-xl"
          size="sm"
          columns={tableColumns}
          isLoading={isLoading}
          loadingCount={6}
          data={contents?.data || []}
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
