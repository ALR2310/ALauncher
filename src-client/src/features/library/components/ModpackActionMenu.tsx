import { ROUTES } from '@shared/constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, FolderOpen, PenBox, Trash2, Upload } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { useContextSelector } from 'use-context-selector';

import { instanceOpenFolder } from '~/api';
import { LibraryModalContext } from '~/context/LibraryModalContext';
import { confirm } from '~/global/confirm';
import { useInstanceCloudUploadMutation, useInstanceDeleteMutation } from '~/hooks/api/useInstanceApi';
import { useSelectInstance } from '~/hooks/app/useSelectInstance';

interface ModpackActionMenuProps {
  className?: string;
  instanceId: string;
}

function ModpackActionMenu({ className, instanceId }: ModpackActionMenuProps) {
  const navigation = useNavigate();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteInstance, isPending: isDeleting } = useInstanceDeleteMutation();
  const { mutateAsync: uploadInstance } = useInstanceCloudUploadMutation();

  const libraryModal = useContextSelector(LibraryModalContext, (ctx) => ctx);

  const { selectInstanceFiles } = useSelectInstance();

  const handleUpload = useCallback(
    async (id: string) => {
      const files = await selectInstanceFiles(id);
      if (files && files.length > 0) {
        toast.promise(uploadInstance({ id, filePaths: files }), {
          pending: 'Uploading...',
          success: 'Upload successfully',
          error: {
            render({ data }: { data: any }) {
              return `${data?.message || 'Upload failed'}`;
            },
          },
        });
      }
    },
    [selectInstanceFiles, uploadInstance],
  );

  const handleDelete = useCallback(async () => {
    const ok = await confirm('Are you sure you want to delete this modpack? This action cannot be undone.');

    if (!ok) return;

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
          render({ data }: { data: any }) {
            return `${data?.message || 'Delete failed'}`;
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
        <button onClick={() => libraryModal.open(instanceId)}>
          <PenBox size={16} /> Edit
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

export default memo(ModpackActionMenu);
