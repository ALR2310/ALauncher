import { CATEGORY_CLASS, MOD_LOADER } from '@shared/constants/curseforge.const';
import { useMemo } from 'react';
import { useContextSelector } from 'use-context-selector';

import { useCategoryQuery } from '~/hooks/api/useCategoryApi';
import { useVersionReleasesQuery } from '~/hooks/api/useVersionApi';
import { buildCategoryTree, CategoryNode } from '~/utils/Discover.utils';

import { DiscoverContext } from '../context/DiscoverContext';

function MenuItem({ node }: { node: CategoryNode }) {
  const categoryIds = useContextSelector(DiscoverContext, (v) => v.categoryIds);
  const setCategoryIds = useContextSelector(DiscoverContext, (v) => v.setCategoryIds);

  const checked = categoryIds.has(node.id);

  const handleToggle = () => {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  if (!node.children.length)
    return (
      <li>
        <label className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checked:checkbox-success"
            checked={checked}
            onChange={handleToggle}
          />
          <span className="truncate flex-1">{node.name}</span>
        </label>
      </li>
    );

  return (
    <li>
      <details>
        <summary>
          <label className="flex min-w-0 items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checked:checkbox-success"
              checked={checked}
              onChange={handleToggle}
            />
            <span className="truncate flex-1">{node.name}</span>
          </label>
        </summary>
        <ul>
          {node.children.map((child) => (
            <MenuItem key={child.id} node={child} />
          ))}
        </ul>
      </details>
    </li>
  );
}

export default function DiscoverFilterBar() {
  const categoryType = useContextSelector(DiscoverContext, (v) => v.categoryType);
  const { data: categories } = useCategoryQuery({ classId: categoryType });
  const { data: versions } = useVersionReleasesQuery();

  const tree = useMemo(() => {
    if (!categories) return [];
    return buildCategoryTree(categories, categoryType);
  }, [categories, categoryType]);

  return (
    <div className="flex flex-col gap-4 w-64 bg-base-200">
      <div className="flex px-3 pt-3">
        <span className="label flex-1/3">Type</span>
        <select className="select flex-2/3">
          {Object.entries(CATEGORY_CLASS).map(([key, value]) => (
            <option key={value} value={value} className="text-nowrap">
              {key}
            </option>
          ))}
        </select>
      </div>

      <div className="flex px-3">
        <span className="label flex-1/3">Version</span>
        <select className="select flex-2/3">
          {versions?.map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          ))}
        </select>
      </div>

      <div className="flex px-3">
        <span className="label flex-1/3">Loader</span>
        <select className="select flex-2/3">
          {Object.entries(MOD_LOADER).map(([key, value]) => (
            <option key={value} value={value}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ul className="menu p-0 w-full">
          {tree.map((node) => (
            <MenuItem key={node.id} node={node} />
          ))}
        </ul>
      </div>
    </div>
  );
}
