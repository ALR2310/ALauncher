import { Category } from '@shared/types/category.type';
import { useEffect, useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

export interface FilterState {
  categoryType: string;
  versionSelected: string;
  loaderType: string;
  selectedCategories: Set<number>;
}

interface BrowseFilterPageProps {
  className?: string;
  categoryId?: number;
  onChange?: (filters: FilterState) => void;
}

export default function BrowseFilterPage({ className, categoryId, onChange }: BrowseFilterPageProps) {
  const { isReady, height } = useContentHeight();
  const [categoryType, setCategoryType] = useState('mc-mods');
  const [versionSelected, setVersionSelected] = useState('');
  const [loaderType, setLoaderType] = useState('0');
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());

  const categoryMutation = useContextSelector(LauncherContext, (v) => v.categoryMutation);
  const releaseVersionsQuery = useContextSelector(LauncherContext, (v) => v.releaseVersionsQuery);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const newSelected = new Set(selectedCategories);

    if (checked) newSelected.add(categoryId);
    else newSelected.delete(categoryId);

    setSelectedCategories(newSelected);
  };

  const renderNode = (node: any) => (
    <li key={node.id}>
      {node.children.length > 0 ? (
        <details>
          <summary>{node.name}</summary>
          <ul>{node.children.map(renderNode)}</ul>
        </details>
      ) : (
        <label>
          <a className="flex items-center gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={selectedCategories.has(node.id)}
              onChange={(e) => handleCategoryChange(node.id, e.target.checked)}
            />
            {node.name}
          </a>
        </label>
      )}
    </li>
  );

  // Fetch the initial category data
  useEffect(() => {
    if (categoryId) {
      categoryMutation.mutate({ classId: categoryId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Set default selected version when data is loaded
  useEffect(() => {
    if (releaseVersionsQuery.isLoading) return;
    if (releaseVersionsQuery.data?.length) setVersionSelected(releaseVersionsQuery.data[0].version);
  }, [releaseVersionsQuery.data, releaseVersionsQuery.isLoading]);

  // Trigger onChange when filters change
  useEffect(() => {
    if (onChange) {
      onChange({
        categoryType,
        versionSelected,
        loaderType,
        selectedCategories,
      });
    }
  }, [categoryType, versionSelected, loaderType, selectedCategories, onChange]);

  const tree = useMemo(() => {
    if (!categoryMutation.data) return [];

    const sorted = [...categoryMutation.data].sort((a, b) => a.name.localeCompare(b.name));

    const map = new Map<number, any>();
    sorted.forEach((c) => map.set(c.id, { ...c, children: [] }));

    const roots: Category[] = [];
    sorted.forEach((c) => {
      if (c.parentCategoryId && map.has(c.parentCategoryId)) {
        map.get(c.parentCategoryId).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });

    return roots;
  }, [categoryMutation.data]);

  return (
    <div className={`${className} flex flex-col p-3 bg-base-300/60 space-y-4`} style={{ height }}>
      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Type:</label>
        <Select
          className="flex-2/3"
          value={categoryType}
          options={[
            { value: 'mc-mods', label: 'Mods' },
            { value: 'data-packs', label: 'Data Packs' },
            { value: 'texture-packs', label: 'Resource Packs' },
            { value: 'shaders', label: 'Shader Packs' },
            { value: 'worlds', label: 'World' },
          ]}
          onChange={(val) => setCategoryType(val)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Version:</label>
        <Select
          className="flex-2/3"
          value={versionSelected}
          options={releaseVersionsQuery.data?.map((v) => ({ label: v.version, value: v.version })) ?? []}
          onChange={(val) => setVersionSelected(val)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Loader:</label>
        <Select
          className="flex-2/3"
          value={loaderType}
          options={[
            { label: 'All', value: '0' },
            { label: 'Forge', value: '1' },
            { label: 'Fabric', value: '4' },
            { label: 'Quilt', value: '5' },
            { label: 'NeoForge', value: '6' },
          ]}
          onChange={(val) => setLoaderType(val)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {isReady && <ul className="menu p-0 flex-nowrap">{tree.map(renderNode)}</ul>}
      </div>
    </div>
  );
}
