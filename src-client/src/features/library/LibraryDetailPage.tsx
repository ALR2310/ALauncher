import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, FolderOpen, Gamepad2, History, SquarePen } from 'lucide-react';
import { useParams } from 'react-router';

import instanceLogo from '~/assets/images/instance-logo.webp';
import DataTable from '~/components/DataTable';
import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: instance } = useInstanceOneQuery(id!);

  const isRunning = false;

  if (instance)
    return (
      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
        {/* Header */}
        <div className="flex gap-4 rounded-xl bg-base-100 border border-base-content/10 p-3">
          <Img src={instanceLogo} alt={instance.name} className="w-16 h-16 object-cover" />
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex w-full justify-between">
              <p className="text-lg font-bold">{instance.name}</p>

              <div className="flex gap-2">
                <button className="btn btn-sm btn-success w-24">Play</button>
                <div className="dropdown dropdown-end">
                  <button className="btn btn-sm btn-soft btn-circle">
                    <EllipsisVertical />
                  </button>
                  <ul tabIndex={-1} className="dropdown-content menu bg-base-200 rounded-box z-1 w-38 shadow mt-3">
                    <li>
                      <a>
                        <FolderOpen size={16} />
                        Open folder
                      </a>
                    </li>
                    <li>
                      <a>
                        <SquarePen size={16} />
                        Edit instance
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {isRunning ? (
              <Progress className="w-full h-5" />
            ) : (
              <div className="flex gap-1 items-center text-sm text-base-content/70">
                <Gamepad2 size={20} />
                <p>
                  {instance.loader ? CurseForgeModLoaderType[instance.loader.type] : 'Release'} - {instance.version}
                </p>

                <div className="divider divider-horizontal mx-3"></div>

                <History size={20} />
                <p>
                  {instance.lastPlayed
                    ? formatDistanceToNow(new Date(instance.lastPlayed), { addSuffix: true })
                    : 'Never played'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex flex-col min-h-0 gap-1">
          <div className="tabs tabs-border flex-nowrap overflow-x-auto">
            <input type="radio" name="content_type" className="tab" aria-label="Mods" defaultChecked />
            <input type="radio" name="content_type" className="tab" aria-label="Resource Packs" />
            <input type="radio" name="content_type" className="tab" aria-label="Shader Packs" />
            <input type="radio" name="content_type" className="tab" aria-label="Data Packs" />
            <input type="radio" name="content_type" className="tab" aria-label="Worlds" />
          </div>

          <DataTable
            className="flex-1 bg-base-100 rounded-xl"
            columns={[
              { key: 'name', title: 'Name', sortable: true },
              { key: 'age', title: 'Age', sortable: true },
              { key: 'address', title: 'Address', sortable: true },
              { key: 'phone', title: 'Phone', sortable: true },
            ]}
            isLoading={true}
            loadingCount={6}
            data={[
              { name: 'John Doe', age: 29, address: '123 Main St', phone: '555-1234' },
              { name: 'Jane Smith', age: 34, address: '456 Oak Ave', phone: '555-5678' },
              { name: 'Sam Johnson', age: 42, address: '789 Pine Rd', phone: '555-8765' },
              { name: 'Alice Brown', age: 27, address: '321 Maple St', phone: '555-4321' },
              { name: 'Bob White', age: 36, address: '654 Cedar Ave', phone: '555-6789' },
              { name: 'Carol Green', age: 31, address: '987 Birch Rd', phone: '555-9876' },
              { name: 'David Black', age: 45, address: '147 Spruce St', phone: '555-2468' },
              { name: 'Jane Smith', age: 34, address: '456 Oak Ave', phone: '555-5678' },
              { name: 'Sam Johnson', age: 42, address: '789 Pine Rd', phone: '555-8765' },
              { name: 'Alice Brown', age: 27, address: '321 Maple St', phone: '555-4321' },
              { name: 'Bob White', age: 36, address: '654 Cedar Ave', phone: '555-6789' },
              { name: 'Carol Green', age: 31, address: '987 Birch Rd', phone: '555-9876' },
              { name: 'David Black', age: 45, address: '147 Spruce St', phone: '555-2468' },
            ]}
            onSortChange={(key, dir) => console.log('Sort changed:', key, dir)}
          />
        </div>
      </div>
    );
}
