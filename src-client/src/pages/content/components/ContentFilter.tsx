import { CategoryDto } from '@shared/dtos/category.dto';
import { categoryMap } from '@shared/mappings/general.mapping';
import { useEffect, useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useFindAllCategoryQuery } from '~/hooks/api/useCategory';
import { useFindReleaseVersionQuery } from '~/hooks/api/useVersion';
import { useContainer } from '~/hooks/app/useContainer';

import { ContentContext } from '../context/ContentContext';

interface ContentFilterProps {
  className?: string;
}

export default function ContentFilter({ className }: ContentFilterProps) {
  const { isReady, height } = useContainer();

  // Get filter states from context
  const instanceId = useContextSelector(ContentContext, (c) => c.instance);
  const categoryType = useContextSelector(ContentContext, (c) => c.categoryType);
  const gameVersion = useContextSelector(ContentContext, (c) => c.gameVersion);
  const loaderType = useContextSelector(ContentContext, (c) => c.loaderType);
  const categoryIds = useContextSelector(ContentContext, (c) => c.categoryIds);
  const setCategoryType = useContextSelector(ContentContext, (c) => c.setCategoryType);
  const setGameVersion = useContextSelector(ContentContext, (c) => c.setGameVersion);
  const setLoaderType = useContextSelector(ContentContext, (c) => c.setLoaderType);
  const handleCategoryChange = useContextSelector(ContentContext, (c) => c.handleCategoryChange);

  // Cache for loaderType when switching away from mc-mods (local state)
  const [cachedLoaderType, setCachedLoaderType] = useState<string>('0');

  // Fetching data
  const findReleasesVersionQuery = useFindReleaseVersionQuery();
  const findAllCategoryQuery = useFindAllCategoryQuery({
    classId: categoryMap.keyToId[categoryType],
  } as any);

  // Set default selected version when data is loaded
  useEffect(() => {
    if (findReleasesVersionQuery.isLoading) return;
    if (findReleasesVersionQuery.data?.length && !gameVersion) {
      setGameVersion(findReleasesVersionQuery.data[0].version);
    }
  }, [gameVersion, findReleasesVersionQuery.data, findReleasesVersionQuery.isLoading, setGameVersion]);

  // Handle category type change with loader cache logic
  const handleCategoryTypeChange = (val: string) => {
    // If switching away from mc-mods, cache current loader type
    if (categoryType === 'mc-mods' && val !== 'mc-mods') {
      setCachedLoaderType(loaderType);
      setLoaderType('0');
    }
    // If switching back to mc-mods, restore cached loader type
    else if (categoryType !== 'mc-mods' && val === 'mc-mods') {
      setLoaderType(cachedLoaderType);
    }

    setCategoryType(val);
  };

  // Render tree node recursively for category hierarchy
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
              checked={categoryIds.has(node.id)}
              onChange={(e) => handleCategoryChange(node.id, e.target.checked)}
            />
            {node.name}
          </a>
        </label>
      )}
    </li>
  );

  // Build category tree structure from flat data
  const tree = useMemo(() => {
    if (!findAllCategoryQuery.data) return [];

    const sorted = [...findAllCategoryQuery.data].sort((a, b) => a.name.localeCompare(b.name));

    const map = new Map<number, any>();
    sorted.forEach((c) => map.set(c.id, { ...c, children: [] }));

    const roots: CategoryDto[] = [];
    sorted.forEach((c) => {
      if (c.parentCategoryId && map.has(c.parentCategoryId)) {
        map.get(c.parentCategoryId).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });

    return roots;
  }, [findAllCategoryQuery.data]);

  return (
    <div
      className={`${className} flex flex-col p-3 bg-base-300/60 space-y-4`}
      style={{ height: isReady ? height : '0px' }}
    >
      {/* Filter Controls Section */}
      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Type:</label>
        <Select
          className="flex-2/3"
          value={categoryType}
          options={Object.entries(categoryMap.keyToText).map(([key, label]) => ({
            value: key,
            label,
          }))}
          onChange={handleCategoryTypeChange}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Version:</label>
        <Select
          className="flex-2/3"
          disabled={!!instanceId}
          value={gameVersion}
          options={findReleasesVersionQuery.data?.map((v) => ({ label: v.version, value: v.version })) ?? []}
          onChange={(val) => setGameVersion(val)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Loader:</label>
        <Select
          className="flex-2/3"
          disabled={!!instanceId}
          value={loaderType}
          options={[
            { label: 'All', value: '0' },
            { label: 'Forge', value: '1' },
            { label: 'Fabric', value: '4' },
            { label: 'Quilt', value: '5' },
            { label: 'NeoForge', value: '6' },
          ]}
          onChange={setLoaderType}
        />
      </div>

      {/* Category Tree Section */}
      <div className="flex-1 overflow-auto">
        <ul className="menu p-0 flex-nowrap">{tree.map(renderNode)}</ul>
      </div>
    </div>
  );
}
