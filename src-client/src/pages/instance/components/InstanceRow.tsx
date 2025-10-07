import { ContentResponseDto } from '@shared/dtos/content.dto';
import { RemoveContentInstanceDto } from '@shared/dtos/instance.dto';
import { Link } from 'react-router';

import { canRemoveContentInstance, removeContentInstance, toggleContentInstance } from '~/api';
import { confirm } from '~/hooks/app/useConfirm';
import { toast } from '~/hooks/app/useToast';

interface InstanceRowProps {
  item: ContentResponseDto['data'][0];
  contentType: RemoveContentInstanceDto['type'];
  instanceId: string;
  selectedIds: number[];
  enabledMap: Record<number, boolean>;
  onSelectionChange: (id: number) => void;
  onToggleEnabled: (id: number, enabled: boolean) => void;
  onRemove: (id: number) => void;
  onRestoreItem: (item: ContentResponseDto['data'][0]) => void;
}

export default function InstanceRow({
  item,
  contentType,
  instanceId,
  selectedIds,
  enabledMap,
  onSelectionChange,
  onToggleEnabled,
  onRemove,
  onRestoreItem,
}: InstanceRowProps) {
  const handleToggleEnabled = async (checked: boolean) => {
    onToggleEnabled(item.id, checked);

    try {
      await toggleContentInstance({
        id: instanceId,
        type: contentType,
        contentIds: [item.id],
        enabled: checked,
      });
    } catch {
      toast.error(`Failed to update status for ${item.name}`);
      onToggleEnabled(item.id, !checked);
    }
  };

  const handleRemove = async () => {
    onRemove(item.id);

    try {
      const checkRemove = await canRemoveContentInstance({
        id: instanceId,
        type: contentType,
        contentId: item.id,
      });

      let shouldRemove = true;

      if (!checkRemove.canRemove) {
        shouldRemove = await confirm({
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

      if (shouldRemove) {
        await removeContentInstance({
          id: instanceId,
          type: contentType,
          contentId: item.id,
        });
      } else {
        onRestoreItem(item);
      }
    } catch (err) {
      toast.error(`Failed to remove ${item.name}`);
      onRestoreItem(item);
    }
  };

  return (
    <tr className={`hover:bg-base-300 ${selectedIds.includes(item.id) ? 'bg-base-200' : ''}`}>
      <th>
        <label>
          <input
            type="checkbox"
            className="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => onSelectionChange(item.id)}
          />
        </label>
      </th>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 shrink-0">
            <img src={item.logo.url} alt={item.logo.title} loading="lazy" className="w-full h-full" />
          </div>
          <div className="flex flex-col">
            <Link
              to={`/contents/${item.slug}?from=instance&instance=${instanceId}`}
              className="font-semibold text-ellipsis-1 w-full hover:underline"
            >
              {item.name}
            </Link>
            <span className="label text-ellipsis-1 w-full">{item.instance?.fileName}</span>
          </div>
        </div>
      </td>
      <td className="text-center">
        <a href={item.authors[0].url} target="_blank" rel="noreferrer noopener" className="italic hover:underline">
          {item.authors[0]?.name ?? 'Unknown'}
        </a>
      </td>
      <td className="text-center">
        {item.instance?.status === 'outdated' ? <button className="btn btn-outline btn-sm">Update</button> : 'Latest'}
      </td>
      <td className="text-center">
        <p className="text-nowrap">{item.fileSize}</p>
      </td>
      <td className="text-center">
        <input
          type="checkbox"
          className="toggle toggle-sm toggle-primary"
          checked={enabledMap[item.id] ?? false}
          onChange={(e) => handleToggleEnabled(e.target.checked)}
        />
      </td>
      <td className="text-right">
        <button className="btn btn-soft btn-sm btn-error" onClick={handleRemove}>
          <i className="fa-light fa-trash"></i>
        </button>
      </td>
    </tr>
  );
}
