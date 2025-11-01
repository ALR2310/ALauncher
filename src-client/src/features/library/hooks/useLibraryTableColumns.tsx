import { ROUTES } from '@shared/constants/routes';
import { ContentDto, ContentInstanceStatus } from '@shared/dtos/content.dto';
import { InstanceContentEnum } from '@shared/enums/general.enum';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { instanceRemoveContent, instanceToggleContent } from '~/api';
import { Column } from '~/components/DataTable';
import Img from '~/components/Img';
import { toast } from '~/hooks/app/useToast';

export interface OnDeleteProps {
  contentIds: number[];
  error?: any;
}

export interface OnToggleProps extends OnDeleteProps {
  enable: boolean;
}
interface UseLibraryTableColumnsProps {
  data: ContentDto[];
  contentType: InstanceContentEnum;
  onToggle?: (props: OnToggleProps) => void;
  onDelete?: (props: OnDeleteProps) => void;
}

export const useLibraryTableColumns = ({ data, contentType, onToggle, onDelete }: UseLibraryTableColumnsProps) => {
  const { id: instanceId } = useParams<{ id: string }>();
  const [selectAll, setSelectAll] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [contentIds, setContentIds] = useState<number[]>([]);

  const handleSelectAll = useCallback(() => {
    if (!data) return;

    if (!selectAll || isIndeterminate) {
      setContentIds(data.map((content) => content.id));
      setSelectAll(true);
      setIsIndeterminate(false);
    } else {
      setContentIds([]);
      setSelectAll(false);
      setIsIndeterminate(false);
    }
  }, [data, isIndeterminate, selectAll]);

  const handleSelectOne = useCallback((id: number) => {
    setContentIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((contentId) => contentId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const allSelected = contentIds.length === data.length;
      const someSelected = contentIds.length > 0 && contentIds.length < data.length;

      setSelectAll(allSelected);
      setIsIndeterminate(someSelected);
    } else {
      setSelectAll(false);
      setIsIndeterminate(false);
    }
  }, [contentIds, data.length]);

  const isMajoritySelected = useMemo(() => {
    if (contentIds.length === 0) {
      const enabledCount = data.filter((content) => content.instance?.enabled).length;
      const totalCount = data.length;

      if (totalCount === 0) return false;
      return enabledCount > totalCount * 0.5;
    }

    const selectedItems = data.filter((content) => contentIds.includes(content.id));
    const enabledCount = selectedItems.filter((content) => content.instance?.enabled).length;

    if (selectedItems.length === 0) return false;
    return enabledCount > selectedItems.length * 0.5;
  }, [data, contentIds]);

  const handleToggle = useCallback(
    async (contentId?: number, enable?: boolean) => {
      const ids = contentId ? [contentId] : contentIds;

      try {
        onToggle?.({ contentIds: ids, enable: enable! });

        await instanceToggleContent({
          id: instanceId!,
          contentType: contentType,
          contentIds: ids,
          enable,
        });
      } catch (err) {
        console.error(err);
        onToggle?.({ contentIds: ids, enable: enable!, error: err });
        toast.error('Failed to toggle selected contents.');
      }
    },
    [contentIds, contentType, instanceId, onToggle],
  );

  const handleDelete = useCallback(
    async (contentId?: number) => {
      const ids = contentId ? [contentId] : contentIds;

      try {
        onDelete?.({ contentIds: ids });

        await instanceRemoveContent({
          id: instanceId!,
          contentType,
          contentIds: ids,
        });
      } catch (err) {
        console.error(err);
        onDelete?.({ contentIds: ids, error: err });
        toast.error('Failed to delete selected contents.');
      }
    },
    [contentIds, contentType, instanceId, onDelete],
  );

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
              if (el) el.indeterminate = isIndeterminate;
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
            <Img className="w-9 h-9" src={row.logo.url} alt={v} />

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
          <div className={`flex items-center justify-between w-full min-w-24`}>
            {contentIds.length > 0 ? (
              <>
                <input
                  type="checkbox"
                  className="toggle toggle-sm checked:toggle-success"
                  checked={isMajoritySelected}
                  onChange={(e) => handleToggle(undefined, e.target.checked)}
                />

                <button className="btn btn-sm btn-error btn-soft px-2 text-center" onClick={() => handleDelete()}>
                  <Trash2 size={16}></Trash2>
                </button>
              </>
            ) : (
              <Link to={ROUTES.discover.path} className="btn btn-success btn-sm btn-soft btn-block">
                <Plus size={20}></Plus>
                Contents
              </Link>
            )}
          </div>
        ),
        render: (_, row) => (
          <div className="flex items-center justify-between">
            <input
              type="checkbox"
              className="toggle toggle-sm checked:toggle-success"
              checked={row.instance?.enabled}
              onChange={(e) => {
                handleToggle(row.id, e.target.checked);
              }}
            />

            <button className="btn btn-sm btn-error btn-soft px-2 text-center" onClick={() => handleDelete(row.id)}>
              <Trash2 size={16}></Trash2>
            </button>
          </div>
        ),
        toggleable: false,
      },
    ],
    [
      isIndeterminate,
      selectAll,
      handleSelectAll,
      contentIds,
      isMajoritySelected,
      handleSelectOne,
      handleToggle,
      handleDelete,
    ],
  );

  return columns;
};
