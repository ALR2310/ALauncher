import { Category } from '@shared/types/category.type';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { throttle } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { LauncherContext } from '~/providers/LauncherProvider';

interface BrowseFilterPageProps {
  className?: string;
  categoryId?: number;
}

export default function BrowseFilterPage({ className, categoryId }: BrowseFilterPageProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const isReady = useRef<boolean>(false);
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

  const updateMenuHeight = throttle(() => {
    if (!divRef.current) return;
    const layoutEl = document.getElementById('layout')!;
    const dockEl = document.getElementById('dockNav')!;
    const height = layoutEl.offsetHeight - dockEl.offsetHeight;
    divRef.current.style.height = `${height}px`;
    isReady.current = true;
  }, 200);

  useEffect(() => {
    updateMenuHeight();

    if (window.isTauri) {
      const unlistenPromise = getCurrentWindow().onResized(() => {
        updateMenuHeight();
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    }
  }, [updateMenuHeight]);

  return (
    <div ref={divRef} className={`${className} flex flex-col p-3 bg-base-300/60 space-y-4`}>
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
        {isReady.current && <ul className="menu flex-nowrap">{tree.map(renderNode)}</ul>}
      </div>
    </div>
  );
}
