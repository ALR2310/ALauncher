import { InstanceFolderTreeDto } from '@shared/dtos/instance.dto';
import { FileText, FolderOpen } from 'lucide-react';
import { createContext, RefObject, useEffect, useRef, useState } from 'react';

import { Modal } from '~/components/Modals';
import { useInstanceFolderTreeQuery } from '~/hooks/api/useInstanceApi';

interface InstanceFileSelectContextType {
  selectInstanceFiles: (id: string) => Promise<string[] | null>;
}

const InstanceFileSelectContext = createContext<InstanceFileSelectContextType>(null!);

const InstanceFileSelectProvider = ({ children }: { children: React.ReactNode }) => {
  const fileModalRef = useRef<HTMLDialogElement>(null!);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [fileResolver, setFileResolver] = useState<(files: string[] | null) => void>();

  const { data: instanceFolderTree } = useInstanceFolderTreeQuery(selectedInstanceId!);

  const selectInstanceFiles = (id: string) =>
    new Promise<string[] | null>((resolve) => {
      setSelectedInstanceId(id);
      setFileResolver(() => resolve);
      fileModalRef.current?.showModal();
    });

  const handleSelectFiles = (files: string[]) => {
    fileResolver?.(files);
    setFileResolver(undefined);
    setSelectedInstanceId(null);
    fileModalRef.current?.close();
  };

  useEffect(() => {
    const modal = fileModalRef.current;
    if (!modal) return;
    const onClose = () => {
      if (fileResolver) {
        fileResolver(null);
        setFileResolver(undefined);
      }
    };
    modal.addEventListener('close', onClose);
    return () => modal.removeEventListener('close', onClose);
  }, [fileResolver]);

  return (
    <InstanceFileSelectContext.Provider value={{ selectInstanceFiles }}>
      {children}

      <ModalSelectInstanceFiles ref={fileModalRef} tree={instanceFolderTree?.children} onSubmit={handleSelectFiles} />
    </InstanceFileSelectContext.Provider>
  );
};

const MenuItem = ({
  node,
  selected,
  toggleSelect,
}: {
  node: InstanceFolderTreeDto;
  selected: Set<string>;
  toggleSelect: (path: string) => void;
}) => {
  const isChecked = selected.has(node.path);

  if (node.type === 'file') {
    return (
      <li>
        <label className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checked:checkbox-success"
            checked={isChecked}
            onChange={() => toggleSelect(node.path)}
          />
          <FileText size={16} className="shrink-0" />
          <span className="truncate flex-1">{node.name}</span>
        </label>
      </li>
    );
  }

  return (
    <li>
      <details open>
        <summary>
          <label className="flex min-w-0 items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checked:checkbox-success"
              checked={isChecked}
              onChange={() => toggleSelect(node.path)}
            />
            <FolderOpen size={16} className="shrink-0" />
            <span className="truncate flex-1 font-semibold">{node.name}</span>
          </label>
        </summary>
        <ul>
          {node.children?.map((child) => (
            <MenuItem key={child.path} node={child} selected={selected} toggleSelect={toggleSelect} />
          ))}
        </ul>
      </details>
    </li>
  );
};

const ModalSelectInstanceFiles = ({
  ref,
  tree,
  onSubmit,
}: {
  ref: RefObject<HTMLDialogElement>;
  tree: InstanceFolderTreeDto[] | undefined;
  onSubmit: (files: string[]) => void;
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleSubmit = () => {
    const files = Array.from(selected);
    onSubmit(files);
  };

  return (
    <Modal
      ref={ref}
      title={<p className="text-center block">Select Instance Files</p>}
      buttonSubmit={{ show: true, onClick: handleSubmit }}
    >
      {tree ? (
        <ul className="menu flex-nowrap bg-base-200 rounded-box w-full max-h-[70vh] overflow-y-auto p-4">
          {tree.map((node) => (
            <MenuItem key={node.path} node={node} selected={selected} toggleSelect={toggleSelect} />
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center opacity-70 text-sm">No files to display.</div>
      )}
    </Modal>
  );
};

export { InstanceFileSelectContext, InstanceFileSelectProvider };
export type { InstanceFileSelectContextType };
