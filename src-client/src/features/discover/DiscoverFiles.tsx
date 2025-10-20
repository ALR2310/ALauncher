import { MOD_LOADER } from '@shared/constants/curseforge.const';
import { FileSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import DataTable from '~/components/DataTable';
import { useContentFilesInfinite } from '~/hooks/api/useContentApi';
import { useVersionReleasesQuery } from '~/hooks/api/useVersionApi';

import { DiscoverContext } from './context/DiscoverContext';

export default function DiscoverFiles() {
  const [gameVersion, setGameVersion] = useState(useContextSelector(DiscoverContext, ({ gameVersion }) => gameVersion));
  const [loaderType, setLoaderType] = useState(useContextSelector(DiscoverContext, ({ loaderType }) => loaderType));
  const contentId = useContextSelector(DiscoverContext, ({ contentId }) => contentId);
  const [allowAlphaFile, setAllowAlphaFile] = useContextSelector(
    DiscoverContext,
    ({ allowAlphaFile, setAllowAlphaFile }) => [allowAlphaFile, setAllowAlphaFile],
  );

  const { data: versions } = useVersionReleasesQuery();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useContentFilesInfinite({
    gameVersion,
    modLoaderType: loaderType === 0 ? undefined : loaderType,
    id: contentId!,
    pageSize: 20,
  });

  const fileData = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  return (
    <div className="h-full flex flex-col min-h-0 gap-4 bg-base-300">
      <div className="flex gap-2 py-2">
        <select className="select w-32" value={gameVersion} onChange={(e) => setGameVersion(e.target.value)}>
          {versions?.map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          ))}
        </select>

        <select className="select w-32" value={loaderType} onChange={(e) => setLoaderType(Number(e.target.value))}>
          {Object.entries(MOD_LOADER).map(([key, value]) => {
            const label = value === MOD_LOADER.Any ? 'All' : key;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>

        <label className="label">
          <input
            type="checkbox"
            className="toggle checked:toggle-success"
            checked={allowAlphaFile}
            onChange={(e) => setAllowAlphaFile(e.target.checked)}
          />
          show alpha files
        </label>
      </div>

      <DataTable
        className="flex-1 bg-base-100 rounded-xl"
        size="sm"
        columns={[
          {
            key: 'releaseType',
            title: 'Type',
            render: (v) => (
              <button
                className={`btn btn-xs btn-outline ${
                  v === 'Release' ? 'btn-success' : v === 'Beta' ? 'btn-warning' : 'btn-secondary'
                }`}
              >
                {{ Alpha: 'A', Beta: 'B', Release: 'R' }[v]}
              </button>
            ),
          },
          { key: 'fileName', title: 'File Name' },
          {
            key: 'fileDate',
            title: 'Uploaded',
            render: (v, row) => (
              <div className="text-center">
                <p>{new Date(v).toLocaleDateString()}</p>
                <p className="text-base-content/60">{row.fileSize}</p>
              </div>
            ),
          },
          { key: 'gameVersions', title: 'Game Versions' },
          {
            key: 'actions',
            title: '',
            render: () => <button className="btn btn-soft btn-sm btn-success ">Install</button>,
          },
        ]}
        data={fileData}
        isLoading={isLoading}
        columnSetting={{ enabled: false }}
        emptyState={
          <span className="text-lg inline-flex items-center gap-2">
            <FileSearch size={20} />
            No files found.
          </span>
        }
        onReachEnd={() => {
          if (hasNextPage && !isFetchingNextPage && !isLoading) {
            fetchNextPage();
          }
        }}
        observerRootMargin="300px"
      />
    </div>
  );
}
