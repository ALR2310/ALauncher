import { CategoryDto } from '@shared/dtos/category.dto';
import { categoryMap } from '@shared/mappings/general.mapping';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

interface BrowseFilterPageProps {
  className?: string;
  categoryId?: number;
}

export default function BrowseFilterPage({ className }: BrowseFilterPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { instanceId } = useParams<{ instanceId: string }>();
  const { isReady, height } = useContentHeight();

  const [categoryType, setCategoryType] = useState(searchParams.get('categoryType') || 'mc-mods');
  const [gameVersion, setGameVersion] = useState(searchParams.get('gameVersion') || '');
  const [loaderType, setLoaderType] = useState(searchParams.get('loaderType') || '0');
  const [categoryIds, setCategoryIds] = useState<Set<number>>(() => {
    const raw = searchParams.get('categoryIds');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });

  const findAllCategoryQuery = useContextSelector(LauncherContext, (v) =>
    v.findAllCategoryQuery({ classId: categoryMap.keyToId[categoryType] }),
  );
  const findReleasesVersionQuery = useContextSelector(LauncherContext, (v) => v.findReleasesVersionQuery);

  // Set default selected version when data is loaded
  useEffect(() => {
    if (findReleasesVersionQuery.isLoading) return;
    if (findReleasesVersionQuery.data?.length && !gameVersion) setGameVersion(findReleasesVersionQuery.data[0].version);
  }, [gameVersion, findReleasesVersionQuery.data, findReleasesVersionQuery.isLoading]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('categoryType', categoryType);
    if (gameVersion) next.set('gameVersion', gameVersion);
    if (loaderType) next.set('loaderType', loaderType);
    if (categoryIds.size > 0) {
      next.set('categoryIds', JSON.stringify([...categoryIds]));
    } else {
      next.delete('categoryIds');
    }
    setSearchParams(next);
  }, [categoryType, loaderType, searchParams, categoryIds, setSearchParams, gameVersion]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const newSelected = new Set(categoryIds);

    if (checked) newSelected.add(categoryId);
    else newSelected.delete(categoryId);

    setCategoryIds(newSelected);
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
              checked={categoryIds.has(node.id)}
              onChange={(e) => handleCategoryChange(node.id, e.target.checked)}
            />
            {node.name}
          </a>
        </label>
      )}
    </li>
  );

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
      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Type:</label>
        <Select
          className="flex-2/3"
          value={categoryType}
          options={Object.entries(categoryMap.keyToText).map(([key, label]) => ({
            value: key,
            label,
          }))}
          onChange={(val) => {
            setCategoryType(val);
            if (val !== 'mc-mods') {
              setLoaderType('0');
            }
          }}
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
        <ul className="menu p-0 flex-nowrap">{tree.map(renderNode)}</ul>
      </div>
    </div>
  );
}
