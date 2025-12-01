import { CategoryClassEnum } from '@shared/enums/general.enum';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { useEffect, useMemo } from 'react';
import { useContextSelector } from 'use-context-selector';

import { DiscoverContext } from '~/context/DiscoverContext';
import { useCategoryQuery } from '~/hooks/api/useCategoryApi';
import { useVersionReleasesQuery } from '~/hooks/api/useVersionApi';
import { buildCategoryTree, CategoryNode } from '~/utils/discover.utils';

const ClassCategories = [
  CategoryClassEnum.Mods,
  CategoryClassEnum['Resource Packs'],
  CategoryClassEnum['Shader Packs'],
  CategoryClassEnum['Data Packs'],
  CategoryClassEnum.Worlds,
  CategoryClassEnum.Modpacks,
];

const ModLoaders = [
  CurseForgeModLoaderType.Any,
  CurseForgeModLoaderType.Forge,
  CurseForgeModLoaderType.Fabric,
  CurseForgeModLoaderType.Quilt,
  CurseForgeModLoaderType.NeoForge,
];

function MenuItem({ node }: { node: CategoryNode }) {
  const categoryIds = useContextSelector(DiscoverContext, (v) => v.categoryIds);
  const setCategoryIds = useContextSelector(DiscoverContext, (v) => v.setCategoryIds);

  const checked = categoryIds.has(node.id);

  const getAllChildIds = (currentNode: CategoryNode): number[] => {
    const ids = [currentNode.id];
    currentNode.children.forEach((child) => {
      ids.push(...getAllChildIds(child));
    });
    return ids;
  };

  const getCheckboxState = (): boolean | 'indeterminate' => {
    if (node.children.length === 0) {
      return categoryIds.has(node.id);
    }

    const allChildIds = getAllChildIds(node).slice(1);
    const selectedChildCount = allChildIds.filter((id) => categoryIds.has(id)).length;

    if (checked) return true;

    return selectedChildCount === 0 ? false : 'indeterminate';
  };

  const handleToggle = () => {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      const allChildIds = getAllChildIds(node);

      if (checked || getCheckboxState() === 'indeterminate') {
        allChildIds.forEach((id) => next.delete(id));
      } else {
        allChildIds.forEach((id) => next.add(id));
      }

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

  const checkboxState = getCheckboxState();
  const isIndeterminate = checkboxState === 'indeterminate';

  return (
    <li>
      <details>
        <summary>
          <label className="flex min-w-0 items-center gap-2">
            <input
              type="checkbox"
              className={`checkbox checkbox-sm checked:checkbox-success ${isIndeterminate ? 'checkbox-success' : ''}`}
              checked={checkboxState === true}
              ref={(el) => {
                if (el) {
                  el.indeterminate = isIndeterminate;
                }
              }}
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
  const setCategoryType = useContextSelector(DiscoverContext, (v) => v.setCategoryType);
  const gameVersion = useContextSelector(DiscoverContext, (v) => v.gameVersion);
  const setGameVersion = useContextSelector(DiscoverContext, (v) => v.setGameVersion);
  const loaderType = useContextSelector(DiscoverContext, (v) => v.loaderType);
  const setLoaderType = useContextSelector(DiscoverContext, (v) => v.setLoaderType);
  const setCategoryIds = useContextSelector(DiscoverContext, (v) => v.setCategoryIds);

  const { data: categories } = useCategoryQuery({ classId: categoryType });
  const { data: versions } = useVersionReleasesQuery();

  const tree = useMemo(() => {
    if (!categories) return [];
    return buildCategoryTree(categories, categoryType);
  }, [categories, categoryType]);

  useEffect(() => {
    if (categoryType !== CategoryClassEnum.Mods) {
      setCategoryIds(new Set());
      setLoaderType(CurseForgeModLoaderType.Any);
    }
  }, [categoryType, setCategoryIds, setLoaderType]);

  return (
    <div className="flex flex-col gap-4 w-64 lg:w-80 bg-base-200">
      <div className="flex px-3 pt-3">
        <span className="label flex-1/3">Type</span>
        <select
          className="select flex-2/3"
          value={categoryType}
          onChange={(e) => {
            setCategoryType(Number(e.target.value));
            setCategoryIds(new Set());
          }}
        >
          {ClassCategories.map((value) => (
            <option key={value} value={value}>
              {CategoryClassEnum[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex px-3">
        <span className="label flex-1/3">Version</span>
        <select className="select flex-2/3" value={gameVersion} onChange={(e) => setGameVersion(e.target.value)}>
          {versions?.map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          ))}
        </select>
      </div>

      <div className="flex px-3">
        <span className="label flex-1/3">Loader</span>
        <select className="select flex-2/3" value={loaderType} onChange={(e) => setLoaderType(Number(e.target.value))}>
          {ModLoaders.map((value) => (
            <option key={value} value={value}>
              {value === CurseForgeModLoaderType.Any ? 'All' : CurseForgeModLoaderType[value]}
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
