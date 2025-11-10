import { InstanceFolderTreeDto } from '@shared/dtos/instance.dto';
import { FileText, FolderOpen } from 'lucide-react';
import { createContext, memo, RefObject, useCallback, useEffect, useRef, useState } from 'react';

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

const MenuItem = memo(
  ({
    node,
    selected,
    toggleSelect,
    getCheckboxState,
    requiredFiles,
  }: {
    node: InstanceFolderTreeDto;
    selected: Set<string>;
    toggleSelect: (path: string, node?: InstanceFolderTreeDto) => void;
    getCheckboxState: (node: InstanceFolderTreeDto) => boolean | 'indeterminate';
    requiredFiles: Set<string>;
  }) => {
    const checkboxState = getCheckboxState(node);
    const isChecked = checkboxState === true;
    const isIndeterminate = checkboxState === 'indeterminate';
    const isRequired = requiredFiles.has(node.path);

    if (node.type === 'file') {
      return (
        <li>
          <label className={`flex min-w-0 items-center gap-2`}>
            <input
              type="checkbox"
              className="checkbox checkbox-sm checked:checkbox-success"
              checked={isChecked}
              disabled={isRequired}
              onChange={() => !isRequired && toggleSelect(node.path)}
            />
            <FileText size={16} className="shrink-0" />
            <span className={`truncate flex-1 ${isRequired ? 'font-semibold' : ''}`}>{node.name}</span>
            {isRequired && <span className="text-xs opacity-70 ml-auto">required</span>}
          </label>
        </li>
      );
    }

    return (
      <li>
        <details>
          <summary>
            <label className={`flex min-w-0 items-center gap-2 ${isRequired ? 'opacity-60' : ''}`}>
              <input
                type="checkbox"
                className="checkbox checkbox-sm checked:checkbox-success"
                checked={isChecked}
                disabled={isRequired}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = isIndeterminate;
                  }
                }}
                onChange={() => !isRequired && toggleSelect(node.path, node)}
              />
              <FolderOpen size={16} className="shrink-0" />
              <span className={`truncate flex-1 font-semibold ${isRequired ? 'font-bold' : ''}`}>{node.name}</span>
              {isRequired && <span className="text-xs opacity-70 ml-auto">required</span>}
            </label>
          </summary>
          <ul>
            {node.children?.map((child) => (
              <MenuItem
                key={child.path}
                node={child}
                selected={selected}
                toggleSelect={toggleSelect}
                getCheckboxState={getCheckboxState}
                requiredFiles={requiredFiles}
              />
            ))}
          </ul>
        </details>
      </li>
    );
  },
);

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
  const requiredFilesRef = useRef<Set<string>>(new Set());

  const getAllPathsInTree = useCallback((node: InstanceFolderTreeDto): string[] => {
    const paths = [node.path];
    if (node.children) {
      node.children.forEach((child) => {
        paths.push(...getAllPathsInTree(child));
      });
    }
    return paths;
  }, []);

  // Auto-select default files and directories when tree is loaded
  useEffect(() => {
    if (!tree) return;

    const defaultItems = new Set<string>();
    const requiredFiles = new Set<string>();
    const defaultFilenames = ['instance.json', 'options.txt'];
    const requiredFilenames = ['instance.json'];
    const defaultDirectories = ['config'];

    const traverseAndSelect = (node: InstanceFolderTreeDto) => {
      if (node.type === 'file' && defaultFilenames.includes(node.name)) {
        defaultItems.add(node.path);
        if (requiredFilenames.includes(node.name)) {
          requiredFiles.add(node.path);
        }
      } else if (node.type === 'directory' && defaultDirectories.includes(node.name)) {
        const allPaths = getAllPathsInTree(node);
        allPaths.forEach((p) => defaultItems.add(p));
      }

      if (node.children) {
        node.children.forEach((child) => traverseAndSelect(child));
      }
    };

    tree.forEach((node) => traverseAndSelect(node));
    setSelected(defaultItems);
    requiredFilesRef.current = requiredFiles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const getChildrenPaths = useCallback((node: InstanceFolderTreeDto): string[] => {
    if (!node.children) return [];
    const paths: string[] = [];
    node.children.forEach((child) => {
      paths.push(child.path);
      if (child.type === 'directory' && child.children) {
        paths.push(...getChildrenPaths(child));
      }
    });
    return paths;
  }, []);

  const getCheckboxState = useCallback(
    (node: InstanceFolderTreeDto): boolean | 'indeterminate' => {
      if (node.type === 'file') {
        return selected.has(node.path);
      }

      const isDirectorySelected = selected.has(node.path);
      const childrenPaths = getChildrenPaths(node);

      if (childrenPaths.length === 0) {
        return isDirectorySelected;
      }

      const selectedCount = childrenPaths.filter((p) => selected.has(p)).length;

      if (isDirectorySelected) {
        return true;
      }

      return selectedCount === 0 ? false : 'indeterminate';
    },
    [selected, getChildrenPaths],
  );

  const toggleSelect = useCallback(
    (path: string, node?: InstanceFolderTreeDto) => {
      // Prevent deselecting required files
      if (requiredFilesRef.current.has(path)) {
        return;
      }

      setSelected((prev) => {
        const next = new Set(prev);

        if (next.has(path)) {
          next.delete(path);
          if (node?.type === 'directory' && node?.children) {
            getAllPathsInTree(node).forEach((p) => {
              if (!requiredFilesRef.current.has(p)) {
                next.delete(p);
              }
            });
          }
        } else {
          next.add(path);
          if (node?.type === 'directory' && node?.children) {
            getAllPathsInTree(node).forEach((p) => next.add(p));
          }
        }
        return next;
      });
    },
    [getAllPathsInTree],
  );

  const getFilePathsOnly = useCallback(() => {
    const filePaths: string[] = [];

    const collectFilePaths = (node: InstanceFolderTreeDto) => {
      if (node.type === 'file' && selected.has(node.path)) {
        filePaths.push(node.path);
      } else if (node.type === 'directory' && node.children) {
        node.children.forEach(collectFilePaths);
      }
    };

    tree?.forEach(collectFilePaths);
    return filePaths;
  }, [selected, tree]);

  const handleSubmit = useCallback(() => {
    onSubmit(getFilePathsOnly());
  }, [getFilePathsOnly, onSubmit]);

  return (
    <Modal
      ref={ref}
      title={<p className="text-center block">Select Instance Files</p>}
      buttonSubmit={{ show: true, onClick: handleSubmit }}
    >
      {tree ? (
        <ul className="menu flex-nowrap bg-base-200 rounded-box w-full max-h-[60vh] overflow-y-auto p-4">
          {tree.map((node) => (
            <MenuItem
              key={node.path}
              node={node}
              selected={selected}
              toggleSelect={toggleSelect}
              getCheckboxState={getCheckboxState}
              requiredFiles={requiredFilesRef.current}
            />
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
