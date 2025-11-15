import { ROUTES } from '@shared/constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, FolderOpen, Trash2, Upload } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

import { instanceOpenFolder } from '~/api';
import { useInstanceCloudUploadMutation, useInstanceDeleteMutation } from '~/hooks/api/useInstanceApi';
import { useSelectInstance } from '~/hooks/app/useSelectInstance';

interface ModpackActionMenuProps {
  className?: string;
  instanceId: string;
}

function ModpackActionMenuComponent({ className, instanceId }: ModpackActionMenuProps) {
  const navigation = useNavigate();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteInstance, isPending: isDeleting } = useInstanceDeleteMutation();
  const { mutateAsync: uploadInstance } = useInstanceCloudUploadMutation();

  const { selectInstanceFiles } = useSelectInstance();

  const handleUpload = useCallback(
    async (id: string) => {
      const files = await selectInstanceFiles(id);
      if (files && files.length > 0) {
        toast.promise(uploadInstance({ id, filePaths: files }), {
          pending: 'Uploading...',
          success: 'Upload successfully',
          error: {
            render({ err }: any) {
              return `Upload failed: ${err?.message || 'Unknown error'}`;
            },
          },
        });
      }
    },
    [selectInstanceFiles, uploadInstance],
  );

  const handleDelete = useCallback(() => {
    toast.promise(
      deleteInstance(instanceId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['instances'] });
        queryClient.invalidateQueries({ queryKey: ['instancesCloud'] });
        navigation(ROUTES.library.path);
      }),
      {
        pending: 'Deleting...',
        success: 'Delete successfully',
        error: {
          render({ err }: any) {
            return `Delete failed: ${err?.message || 'Unknown error'}`;
          },
        },
      },
    );
  }, [deleteInstance, instanceId, navigation, queryClient]);

  return (
    <ul className={`menu dropdown-content ${className}`}>
      <li>
        <button className="text-error" disabled={isDeleting} onClick={handleDelete}>
          {isDeleting ? <div className="loading loading-spinner"></div> : <Trash2 size={16} />} Delete
        </button>
      </li>
      <li>
        <button onClick={() => instanceOpenFolder(instanceId)}>
          <FolderOpen size={16} /> Open Folder
        </button>
      </li>
      <li>
        <button>
          <Copy size={16} /> Duplicate
        </button>
      </li>
      <li>
        <button onClick={() => handleUpload(instanceId)}>
          <Upload size={16} /> Upload
        </button>
      </li>
    </ul>
  );
}

export const ModpackActionMenu = memo(ModpackActionMenuComponent);
