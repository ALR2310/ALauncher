import { ContentResponseDto } from '@shared/dtos/content.dto';
import { RemoveContentInstanceDto } from '@shared/dtos/instance.dto';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { removeContentInstance } from '~/api';
import { useFindContentsInstanceQuery } from '~/hooks/api/useInstance';
import { confirm } from '~/hooks/app/useConfirm';
import { toast } from '~/hooks/app/useToast';

import EmptyState from './EmptyState';
import InstanceRow from './InstanceRow';
import InstanceTableHeader from './InstanceTableHeader';
import SkeletonRow from './SkeletonRow';

interface InstanceTableProps {
  contentData: ContentResponseDto['data'];
  contentType: RemoveContentInstanceDto['type'];
  isLoading?: boolean;
}

export default function InstanceTable({ contentData, contentType, isLoading }: InstanceTableProps) {
  const { id } = useParams<{ id: string }>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<number, boolean>>({});
  const [contents, setContents] = useState(contentData);
  const [isDeleting, setIsDeleting] = useState(false);

  const { refetch } = useFindContentsInstanceQuery(id!, contentType);

  // Update contents when contentData changes
  useEffect(() => setContents(contentData), [contentData]);

  // Initialize enabledMap when contents change
  useEffect(() => {
    const init: Record<number, boolean> = {};
    contents.forEach((item) => (init[item.id] = item.instance!.enabled));
    setEnabledMap(init);
  }, [contents]);

  const handleSelectAll = () => {
    if (selectedIds.length === contents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contents.map((item) => item.id));
    }
  };

  const handleSelectionChange = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [id]: enabled }));
  };

  const handleRemoveItem = (id: number) => {
    setContents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRestoreItem = (item: ContentResponseDto['data'][0]) => {
    setContents((prev) => [...prev, item]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: 'Confirm bulk removal',
      content: (
        <div className="text-sm text-base-content/70">
          <p>Are you sure you want to remove {selectedIds.length} selected item(s)?</p>
          <p className="mt-2 text-warning">This action cannot be undone.</p>
        </div>
      ),
    });

    if (!confirmed) return;

    setIsDeleting(true);
    const failedItems: string[] = [];
    const originalContents = [...contents];

    try {
      setContents((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);

      for (const contentId of selectedIds) {
        try {
          await removeContentInstance({
            id: id!,
            type: contentType,
            contentId,
          });
        } catch (error) {
          const item = originalContents.find((c) => c.id === contentId);
          failedItems.push(item?.name || `Item ${contentId}`);
        }
      }

      if (failedItems.length > 0) {
        toast.error(`Failed to remove: ${failedItems.join(', ')}`);
        const failedItemIds = originalContents.filter((item) => failedItems.includes(item.name)).map((item) => item.id);
        const restoredItems = originalContents.filter((item) => failedItemIds.includes(item.id));
        setContents((prev) => [...prev, ...restoredItems]);
      } else {
        toast.success(`Successfully removed ${selectedIds.length} item(s)`);
      }
    } catch (error) {
      toast.error('Failed to process bulk deletion');
      setContents(originalContents);
      setSelectedIds(selectedIds);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="overflow-auto flex flex-col h-full justify-between m-2 bg-base-100">
      <table className="table table-sm table-pin-rows">
        <InstanceTableHeader
          selectedIds={selectedIds}
          contents={contents}
          enabledMap={enabledMap}
          instanceId={id!}
          contentType={contentType}
          isDeleting={isDeleting}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          onRefetch={() => refetch()}
          onUpdateEnabledMap={setEnabledMap}
        />
        <tbody>
          {!isLoading && contents.length === 0 && <EmptyState colSpan={7} />}
          {isLoading && Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)}
          {contents.map((item) => (
            <InstanceRow
              key={item.id}
              item={item}
              contentType={contentType}
              instanceId={id!}
              selectedIds={selectedIds}
              enabledMap={enabledMap}
              onSelectionChange={handleSelectionChange}
              onToggleEnabled={handleToggleEnabled}
              onRemove={handleRemoveItem}
              onRestoreItem={handleRestoreItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
