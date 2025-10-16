import { Link, useParams } from 'react-router';

import DataTable from '~/components/DataTable';
import { useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

import LibraryDetailHeader from './components/LibraryDetailHeader';

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: instance } = useInstanceOneQuery(id!);

  if (instance)
    return (
      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
        {/* Header */}
        <LibraryDetailHeader data={instance} />

        {/* Tabs */}
        <div className="flex-1 flex flex-col min-h-0 gap-1">
          <div className="tabs tabs-border tabs-border-success flex-nowrap overflow-x-auto">
            <input type="radio" name="content_type" className="tab tab-success!" aria-label="Mods" defaultChecked />
            <input type="radio" name="content_type" className="tab" aria-label="Resource Packs" />
            <input type="radio" name="content_type" className="tab" aria-label="Shader Packs" />
            <input type="radio" name="content_type" className="tab" aria-label="Data Packs" />
            <input type="radio" name="content_type" className="tab" aria-label="Worlds" />
          </div>

          <DataTable
            className="flex-1 bg-base-100 rounded-xl"
            columns={[
              { key: 'id', title: '' },
              { key: 'name', title: 'Additional utilities', sortable: true },
              { key: 'author', title: 'Author', sortable: true },
              { key: 'activity', title: 'Activity', sortable: true },
              { key: 'status', title: 'Status' },
              { key: '', title: '' },
            ]}
            isLoading={false}
            loadingCount={6}
            data={[]}
            onSortChange={(key, dir) => console.log('Sort changed:', key, dir)}
            emptyState={
              <>
                No contents found.{' '}
                <Link to={'/discover'} className="link hover:link-success">
                  Install now
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
}
