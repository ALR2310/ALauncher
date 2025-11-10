import { ContentFileDto } from '@shared/dtos/content.dto';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useContextSelector } from 'use-context-selector';

import { Column } from '~/components/DataTable';
import Tooltip from '~/components/Tooltip';
import { DiscoverContext } from '~/context/DiscoverContext';
import { useInstanceAddContentSSE, useInstanceOneQuery } from '~/hooks/api/useInstanceApi';
import { useSelectInstance } from '~/hooks/app/useSelectInstance';

type FileStatus = 'idle' | 'installing' | 'installed';

export function useFilesTableColumns() {
  const { selectInstance } = useSelectInstance();
  const { addContent, isDone } = useInstanceAddContentSSE();

  const queryClient = useQueryClient();

  const instanceId = useContextSelector(DiscoverContext, (v) => v.instanceId);

  const [fileStatuses, setFileStatuses] = useState<Map<number, FileStatus>>(new Map());
  const [currentFileId, setCurrentFileId] = useState<number | null>(null);

  const { data: instance } = useInstanceOneQuery(instanceId!);

  const isFileInstalled = useCallback(
    (fileId: number) => {
      if (!instance) return false;

      const allContents = [
        ...(instance.mods || []),
        ...(instance.resourcepacks || []),
        ...(instance.shaderpacks || []),
        ...(instance.datapacks || []),
      ];

      return allContents.some((content) => content.fileId === fileId);
    },
    [instance],
  );

  const handleInstall = useCallback(
    async (cid: number, fileId: number) => {
      const id = instanceId ?? (await selectInstance());
      if (!id) return toast.warning('Please select an instance to add content to.');

      setCurrentFileId(fileId);
      setFileStatuses((prev) => new Map(prev).set(fileId, 'installing'));
      addContent({ id, contentId: cid, fileId, worlds: undefined });
    },
    [addContent, instanceId, selectInstance],
  );

  useEffect(() => {
    if (isDone && currentFileId !== null) {
      setFileStatuses((prev) => new Map(prev).set(currentFileId, 'installed'));
      setCurrentFileId(null);
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['instance'] });
    }
  }, [isDone, currentFileId, queryClient]);

  const columns = useMemo<Column<ContentFileDto>[]>(
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
        render: (_, row) => {
          const status = fileStatuses.get(row.id) || 'idle';
          const isInstalling = status === 'installing';
          const wasJustInstalled = status === 'installed';
          const alreadyInstalled = isFileInstalled(row.id);
          const isInstalled = wasJustInstalled || alreadyInstalled;

          return (
            <button
              disabled={isInstalled}
              className={`btn btn-soft btn-sm btn-success w-20 ${isInstalling ? 'pointer-events-none' : ''}`}
              onClick={() => handleInstall(row.contentId, row.id)}
            >
              {isInstalling ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : isInstalled ? (
                'Installed'
              ) : (
                'Install'
              )}
            </button>
          );
        },
      },
    ],
    [handleInstall, fileStatuses, isFileInstalled],
  );

  return { columns };
}
