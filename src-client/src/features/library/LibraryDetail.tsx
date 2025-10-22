import { ROUTES } from '@shared/constants/routes';
import { InstanceContentDto } from '@shared/dtos/instance.dto';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import DataTable, { Column } from '~/components/DataTable';
import { useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

import LibraryDetailHeader from './components/LibraryDetailHeader';

const tabs = [
  { key: 'mods', title: 'Mods', checked: true },
  { key: 'resourcepacks', title: 'Resource Packs' },
  { key: 'shaderpacks', title: 'Shader Packs' },
  { key: 'datapacks', title: 'Data Packs' },
  { key: 'worlds', title: 'Worlds' },
];

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('mods');
  const { data: instance, isLoading } = useInstanceOneQuery(id!);

  const tableColumns = useMemo<Column<InstanceContentDto>[]>(
    () => [
      { key: 'id', title: '', toggleable: false },
      { key: 'name', title: 'Additional utilities', sortable: true, toggleable: false },
      { key: 'author', title: 'Author', sortable: true },
      { key: 'activity', title: 'Activity', sortable: true },
      { key: 'status', title: 'Status' },
      {
        key: '',
        title: (
          <button className="btn btn-success btn-sm btn-soft">
            <Plus size={20}></Plus>
            Contents
          </button>
        ),
        toggleable: false,
      },
    ],
    [],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
      {/* Header */}
      <LibraryDetailHeader data={instance} isLoading={isLoading} />

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
          columns={tableColumns}
          isLoading={isLoading}
          loadingCount={6}
          data={instance?.[tab]}
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
