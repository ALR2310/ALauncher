import { CATEGORY_CLASS } from '@shared/constants/curseforge.const';
import { ROUTES } from '@shared/constants/routes';
import { ContentDto, ContentInstanceStatus } from '@shared/dtos/content.dto';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import DataTable, { Column } from '~/components/DataTable';
import Img from '~/components/Img';
import { useInstanceGetContentsQuery, useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

import { DiscoverContext } from '../discover/context/DiscoverContext';
import LibraryDetailHeader from './components/LibraryDetailHeader';

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

  const tableColumns = useMemo<Column<ContentDto>[]>(
    () => [
      {
        key: '',
        title: <input type="checkbox" className="checkbox checked:checkbox-success" />,
        render: () => <input type="checkbox" className="checkbox checked:checkbox-success" />,
        toggleable: false,
      },
      {
        key: 'name',
        title: 'Additional utilities',
        render: (v, row) => (
          <div className="flex items-stretch gap-2">
            <Img className="w-[36px] h-[36px]" src={row.logo.url} alt={v} />

            <div className="flex-1">
              <p className="line-clamp-1">{v}</p>
              <span className="line-clamp-1 text-base-content/60">{row.instance?.fileName}</span>
            </div>
          </div>
        ),
        sortable: true,
        toggleable: false,
      },
      {
        key: 'fileSize',
        title: 'Size',
        render: (v) => <div className="text-center text-nowrap">{v}</div>,
      },
      {
        key: '',
        title: 'Activity',
        render: (_, row) => (
          <div className="text-center">
            {row.instance?.status === ContentInstanceStatus.INSTALLED ? (
              'Latest'
            ) : row.instance?.status === ContentInstanceStatus.OUTDATED ? (
              <button className="btn btn-sm btn-outline btn-success">Update</button>
            ) : (
              'Incompatible'
            )}
          </div>
        ),
      },
      {
        key: '',
        title: (
          <div className="text-end w-full">
            <Link to={ROUTES.discover.path} className="btn btn-success btn-sm btn-soft">
              <Plus size={20}></Plus>
              Contents
            </Link>
          </div>
        ),
        render: () => (
          <div className="flex items-center justify-between">
            <input type="checkbox" className="toggle toggle-sm checked:toggle-success" />

            <button className="btn btn-sm btn-error btn-soft px-2 text-center">
              <Trash2 size={16}></Trash2>
            </button>
          </div>
        ),
        toggleable: false,
      },
    ],
    [],
  );

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
