import { ROUTES } from '@shared/constants/routes';
import { ContentDto, ContentInstanceStatus } from '@shared/dtos/content.dto';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { Column } from '~/components/DataTable';
import Img from '~/components/Img';

interface UseLibraryTableColumnsProps {
  contentIds: number[];
  setContentIds: React.Dispatch<React.SetStateAction<number[]>>;
  contents?: { data: ContentDto[] };
}

export const useLibraryTableColumns = ({ contentIds, setContentIds, contents }: UseLibraryTableColumnsProps) => {
  const [selectAll, setSelectAll] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const handleSelectAll = useCallback(() => {
    if (!contents?.data) return;

    if (!selectAll || isIndeterminate) {
      setContentIds(contents.data.map((content) => content.id));
      setSelectAll(true);
      setIsIndeterminate(false);
    } else {
      setContentIds([]);
      setSelectAll(false);
      setIsIndeterminate(false);
    }
  }, [selectAll, isIndeterminate, contents, setContentIds]);

  const handleSelectOne = useCallback(
    (id: number) => {
      setContentIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((contentId) => contentId !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [setContentIds],
  );

  // Cập nhật selectAll và indeterminate state khi contentIds thay đổi
  useEffect(() => {
    if (contents?.data && contents.data.length > 0) {
      const allSelected = contentIds.length === contents.data.length;
      const someSelected = contentIds.length > 0 && contentIds.length < contents.data.length;

      setSelectAll(allSelected);
      setIsIndeterminate(someSelected);
    } else {
      setSelectAll(false);
      setIsIndeterminate(false);
    }
  }, [contentIds, contents?.data]);

  const columns = useMemo<Column<ContentDto>[]>(
    () => [
      {
        key: '',
        title: (
          <input
            type="checkbox"
            className={`checkbox ${isIndeterminate ? 'checkbox-success indeterminate' : 'checked:checkbox-success'}`}
            checked={selectAll}
            ref={(el) => {
              if (el) {
                el.indeterminate = isIndeterminate;
              }
            }}
            onChange={handleSelectAll}
          />
        ),
        render: (_, row) => (
          <input
            type="checkbox"
            className="checkbox checked:checkbox-success"
            checked={contentIds.includes(row.id)}
            onChange={() => handleSelectOne(row.id)}
          />
        ),
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
          <div className="flex items-center justify-evenly">
            <input type="checkbox" className="toggle toggle-sm checked:toggle-success" />

            <button className="btn btn-sm btn-error btn-soft px-2 text-center">
              <Trash2 size={16}></Trash2>
            </button>
          </div>
        ),
        toggleable: false,
      },
    ],
    [selectAll, contentIds, isIndeterminate, handleSelectAll, handleSelectOne],
  );

  return columns;
};
