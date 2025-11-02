import { ContentFileDto } from '@shared/dtos/content.dto';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { FileSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import DataTable, { Column } from '~/components/DataTable';
import Tooltip from '~/components/Tooltip';
import { DiscoverContext } from '~/context/DiscoverContext';
import { useContentFilesInfinite } from '~/hooks/api/useContentApi';

export default function DiscoverFiles() {
  const contentId = useContextSelector(DiscoverContext, ({ contentId }) => contentId);
  const fileVersions = useContextSelector(DiscoverContext, (v) => v.fileVersions);
  const fileLoaders = useContextSelector(DiscoverContext, (v) => v.fileLoaders);

  const [showAlphaFiles, setShowAlphaFiles] = useContextSelector(DiscoverContext, (v) => [
    v.showAlphaFiles,
    v.setShowAlphaFiles,
  ]);
  const [pageSize, setPageSize] = useContextSelector(DiscoverContext, (v) => [v.pageSize, v.setPageSize]);
  const [fileVersion, setFileVersion] = useState(useContextSelector(DiscoverContext, (v) => v.fileVersion));
  const [fileLoader, setFileLoader] = useState(useContextSelector(DiscoverContext, (v) => v.fileLoader));

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useContentFilesInfinite({
    gameVersion: fileVersion,
    modLoaderType: fileLoader === 0 ? undefined : fileLoader,
    id: contentId!,
    pageSize: pageSize,
  });

  const fileData = useMemo(() => {
    if (!data) return [];
    const allFiles = data.pages.flatMap((page) => page.data);

    if (!showAlphaFiles) {
      return allFiles.filter((file) => file.releaseType !== 'Alpha');
    }

    return allFiles;
  }, [data, showAlphaFiles]);

  const tableColumns = useMemo<Column<ContentFileDto>[]>(
    () => [
      {
        key: 'releaseType',
        title: 'Type',
        render: (v) => (
          <button
            className={`btn btn-xs btn-outline ${
              v === 'Release' ? 'btn-success' : v === 'Beta' ? 'btn-secondary' : 'btn-warning'
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
      {
        key: 'gameVersions',
        title: 'Versions',
        render: (v: string[], _row) => {
          if (!v || v.length === 0) return null;
          const remaining = v.length - 1;

          if (remaining === 0) {
            return <span>{v[0]}</span>;
          }

          return (
            <Tooltip
              content={
                <div className="flex flex-col gap-1">
                  {v.slice(1).map((version, idx) => (
                    <div key={idx}>{version}</div>
                  ))}
                </div>
              }
            >
              <span className="cursor-help">
                {v[0]}
                <span className="text-base-content/60"> +{remaining}</span>
              </span>
            </Tooltip>
          );
        },
      },
      {
        key: 'modLoaders',
        title: 'Loaders',
        render: (v: string[], _row) => {
          if (!v || v.length === 0) return null;
          const remaining = v.length - 1;

          if (remaining === 0) {
            return <span>{v[0]}</span>;
          }

          return (
            <Tooltip
              content={
                <div className="flex flex-col gap-1">
                  {v.slice(1).map((loader, idx) => (
                    <div key={idx}>{loader}</div>
                  ))}
                </div>
              }
            >
              <span className="cursor-help">
                {v[0]}
                <span className="text-base-content/60"> +{remaining}</span>
              </span>
            </Tooltip>
          );
        },
      },
      {
        key: 'actions',
        title: '',
        render: () => <button className="btn btn-soft btn-sm btn-success ">Install</button>,
      },
    ],
    [],
  );

  return (
    <div className="h-full flex flex-col min-h-0 gap-4 bg-base-300">
      <div className="flex gap-2 py-2 px-1 justify-between">
        <div className="flex gap-2">
          <select className="select w-32" value={fileVersion} onChange={(e) => setFileVersion(e.target.value)}>
            <option value="">All Version</option>
            {fileVersions?.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>

          <select className="select w-32" value={fileLoader} onChange={(e) => setFileLoader(Number(e.target.value))}>
            <option value="0">All Loader</option>
            {fileLoaders.map((loader) => (
              <option key={loader} value={CurseForgeModLoaderType[loader]}>
                {loader}
              </option>
            ))}
          </select>

          <label className="label">
            <input
              type="checkbox"
              className="toggle checked:toggle-success"
              checked={showAlphaFiles}
              onChange={(e) => setShowAlphaFiles(e.target.checked)}
            />
            show alpha files
          </label>
        </div>

        <select className="select w-16" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      <DataTable
        className="flex-1 bg-base-100 rounded-xl"
        size="sm"
        columns={tableColumns}
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
