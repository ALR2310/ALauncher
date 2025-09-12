import { ContentResponseDto } from '@shared/dtos/content.dto';
import { RemoveContentInstanceDto } from '@shared/dtos/instance.dto';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

import { toggleContentInstance } from '~/api/instance.api';
import { confirm } from '~/hooks/useConfirm';
import { toast } from '~/hooks/useToast';
import { LauncherContext } from '~/providers/LauncherProvider';

interface ManagerTablePageProps {
  contentData: ContentResponseDto['data'];
  contentType: RemoveContentInstanceDto['type'];
  onRefresh?: () => void;
}

export default function ManagerTablePage({ contentData, contentType, onRefresh }: ManagerTablePageProps) {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<number, boolean>>({});

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const canRemoveContentMutation = useContextSelector(LauncherContext, (v) => v.canRemoveContentInstanceMutation);
  const removeContentMutation = useContextSelector(LauncherContext, (v) => v.removeContentInstanceMutation);

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = selectedIds.length > 0 && selectedIds.length < contentData.length;
    }
  }, [contentData.length, selectedIds.length]);

  useEffect(() => {
    const init: Record<number, boolean> = {};
    contentData.forEach((item) => {
      init[item.id] = item.enabled!;
    });
    setEnabledMap(init);
  }, [contentData]);

  return (
    <div className="overflow-auto flex flex-col h-full justify-between m-2 bg-base-100">
      <table className="table table-sm table-pin-rows">
        <thead>
          <tr>
            <th>
              <input
                ref={masterCheckboxRef}
                type="checkbox"
                className="checkbox"
                checked={selectedIds.length === contentData.length && contentData.length > 0}
                onChange={() => {
                  if (selectedIds.length === contentData.length) setSelectedIds([]);
                  else setSelectedIds(contentData.map((item) => item.id));
                }}
              />
            </th>
            <th>Additional utilities</th>
            <th className="text-center">Author</th>
            <th className="text-center">Activity</th>
            <th className="text-center">
              {selectedIds.length === contentData.length ? (
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={(() => {
                    const enabledCount = selectedIds.filter((id) => enabledMap[id]).length;
                    const disabledCount = selectedIds.length - enabledCount;
                    return enabledCount > disabledCount;
                  })()}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    setEnabledMap((prev) => {
                      const updated = { ...prev };
                      selectedIds.forEach((id) => (updated[id] = checked));
                      return updated;
                    });

                    toggleContentInstance({
                      id: instanceId!,
                      type: contentType,
                      contentIds: selectedIds,
                      enabled: checked,
                    }).catch(() => {
                      toast.error(`Failed to update status for selected contents`);
                      setEnabledMap((prev) => {
                        const updated = { ...prev };
                        selectedIds.forEach((id) => (updated[id] = !checked));
                        return updated;
                      });
                    });
                  }}
                />
              ) : (
                'Status'
              )}
            </th>
            <th className="text-right">
              <button className="btn btn-soft btn-sm" onClick={onRefresh}>
                <i className="fa-light fa-rotate"></i>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {contentData.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center italic text-base-content/70">
                No contents found
              </td>
            </tr>
          )}
          {contentData.map((item) => (
            <tr key={item.id} className={`hover:bg-base-300 ${selectedIds.includes(item.id) ? 'bg-base-200' : ''}`}>
              <th>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => {
                      setSelectedIds((prev) =>
                        prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id],
                      );
                    }}
                  />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div className="w-8">
                    <img src={item.logoUrl} alt={item.name} loading="lazy" className="w-full h-full" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                </div>
              </td>
              <td className="text-center">
                <span className="italic">{item.authors[0]?.name ?? 'Unknown'}</span>
              </td>
              <td className="text-center">
                {item.status === 'outdated' ? <button className="btn btn-outline btn-sm">Update</button> : 'Latest'}
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={enabledMap[item.id] ?? false}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setEnabledMap((prev) => ({ ...prev, [item.id]: checked }));

                    toggleContentInstance({
                      id: instanceId!,
                      type: contentType,
                      contentIds: [item.id],
                      enabled: e.target.checked,
                    }).catch(() => {
                      toast.error(`Failed to update status for ${item.name}`);
                      setEnabledMap((prev) => ({ ...prev, [item.id]: !checked }));
                    });
                  }}
                />
              </td>
              <td className="text-right">
                <button
                  className="btn btn-soft btn-sm btn-error"
                  onClick={async () => {
                    const checkRemove = await canRemoveContentMutation.mutateAsync({
                      id: instanceId!,
                      type: contentType,
                      contentId: item.id,
                    });

                    let yes = true;

                    if (!checkRemove.canRemove) {
                      yes = await confirm({
                        title: 'Confirm removal',
                        content: (
                          <div className="text-sm text-base-content/70">
                            <p>{checkRemove.message}</p>
                            <p>Are you sure you want to remove this content?</p>
                            <ul className="list-disc list-inside mt-2 mb-4 max-h-24 overflow-auto">
                              {checkRemove.dependents.map((dep, idx) => (
                                <li key={idx}>{dep}</li>
                              ))}
                            </ul>
                          </div>
                        ),
                      });
                    }

                    if (yes)
                      await removeContentMutation
                        .mutateAsync({
                          id: instanceId!,
                          type: contentType,
                          contentId: item.id,
                        })
                        .then(() => onRefresh?.());
                  }}
                >
                  <i className="fa-light fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
