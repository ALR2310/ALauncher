import { Category } from '@shared/types/category.type';
import { useEffect, useMemo } from 'react';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

interface BrowseFilterPageProps {
  className?: string;
  categoryId?: number;
}

export default function BrowseFilterPage({ className, categoryId }: BrowseFilterPageProps) {
  const { isReady, height } = useContentHeight();

  const categoryMutation = useContextSelector(LauncherContext, (v) => v.categoryMutation);

  useEffect(() => {
    if (categoryId) {
      categoryMutation.mutate({ classId: categoryId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

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
            <input type="checkbox" className="checkbox checkbox-sm" /> {node.name}
          </a>
        </label>
      )}
    </li>
  );

  return (
    <div className={`${className} flex flex-col p-3 bg-base-300/60 space-y-4`} style={{ height }}>
      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Type:</label>
        <Select className="flex-2/3" options={[]} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Version:</label>
        <Select className="flex-2/3" options={[]} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="label flex-1/3">Loader:</label>
        <Select className="flex-2/3" options={[]} />
      </div>

      <div className="flex-1 overflow-auto">
        {isReady && <ul className="menu flex-nowrap">{tree.map(renderNode)}</ul>}
      </div>
    </div>
  );
}
