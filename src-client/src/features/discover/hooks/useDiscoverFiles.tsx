import { ContentFileDto } from '@shared/dtos/content.dto';
import { useMemo } from 'react';

import { Column } from '~/components/DataTable';
import Tooltip from '~/components/Tooltip';

export function useFilesTableColumns() {
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
        render: () => <button className="btn btn-soft btn-sm btn-success ">Install</button>,
      },
    ],
    [],
  );

  return { columns };
}
