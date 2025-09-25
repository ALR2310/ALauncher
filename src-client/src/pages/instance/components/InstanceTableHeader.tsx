import { RemoveContentInstanceDto } from '@shared/dtos/instance.dto';
import { useEffect, useRef } from 'react';

import { toggleContentInstance } from '~/api';
import { toast } from '~/hooks/app/useToast';

interface InstanceTableHeaderProps {
  selectedIds: number[];
  contents: any[];
  enabledMap: Record<number, boolean>;
  instanceId: string;
  contentType: RemoveContentInstanceDto['type'];
  isDeleting: boolean;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onRefetch: () => void;
  onUpdateEnabledMap: (updater: (prev: Record<number, boolean>) => Record<number, boolean>) => void;
}

export default function InstanceTableHeader({
  selectedIds,
  contents,
  enabledMap,
  instanceId,
  contentType,
  isDeleting,
  onSelectAll,
  onBulkDelete,
  onRefetch,
  onUpdateEnabledMap,
}: InstanceTableHeaderProps) {
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Master checkbox indeterminate state
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = selectedIds.length > 0 && selectedIds.length < contents.length;
    }
  }, [contents.length, selectedIds.length]);

  const handleBulkToggle = async (checked: boolean) => {
    onUpdateEnabledMap((prev) => {
      const updated = { ...prev };
      selectedIds.forEach((id) => (updated[id] = checked));
      return updated;
    });

    try {
      await toggleContentInstance({
        id: instanceId,
        type: contentType,
        contentIds: selectedIds,
        enabled: checked,
      });
    } catch {
      toast.error(`Failed to update status for selected contents`);
      onUpdateEnabledMap((prev) => {
        const updated = { ...prev };
        selectedIds.forEach((id) => (updated[id] = !checked));
        return updated;
      });
    }
  };

  const getBulkToggleChecked = () => {
    const enabledCount = selectedIds.filter((id) => enabledMap[id]).length;
    const disabledCount = selectedIds.length - enabledCount;
    return enabledCount > disabledCount;
  };

  return (
    <thead>
      <tr>
        <th>
          <input
            ref={masterCheckboxRef}
            type="checkbox"
            className="checkbox"
            checked={selectedIds.length === contents.length && contents.length > 0}
            onChange={onSelectAll}
          />
        </th>
        <th>Additional utilities</th>
        <th className="text-center">Author</th>
        <th className="text-center">Activity</th>
        <th className="text-center">Size</th>
        <th className="text-center">
          {selectedIds.length === contents.length ? (
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={getBulkToggleChecked()}
              onChange={(e) => handleBulkToggle(e.target.checked)}
            />
          ) : (
            'Status'
          )}
        </th>
        <th className="text-right">
          {selectedIds.length === contents.length && contents.length > 0 ? (
            <button className="btn btn-soft btn-sm btn-error" onClick={onBulkDelete} disabled={isDeleting}>
              {isDeleting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <i className="fa-light fa-trash"></i>
              )}
            </button>
          ) : (
            <button className="btn btn-soft btn-sm" onClick={onRefetch}>
              <i className="fa-light fa-rotate"></i>
            </button>
          )}
        </th>
      </tr>
    </thead>
  );
}
