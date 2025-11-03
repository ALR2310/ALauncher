import { CurseForgeModLoaderType } from 'curseforge-api';
import { FileSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import DataTable from '~/components/DataTable';
import { DiscoverContext } from '~/context/DiscoverContext';
import { useContentFilesInfinite } from '~/hooks/api/useContentApi';

import { useFilesTableColumns } from './hooks/useDiscoverFiles';

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

  const { columns: tableColumns } = useFilesTableColumns();

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
