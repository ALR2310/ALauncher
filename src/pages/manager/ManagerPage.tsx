import { categoryMap, loaderMap } from '@shared/mappings/general.mapping';
import { useState } from 'react';
import { createSearchParams, Link, useNavigate, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

import ManagerTablePage from './components/ManagerTablePage';

const tabs = Object.entries(categoryMap.keyToText).map(([key, label]) => ({ key, label }));

export default function ManagerPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { height, isReady } = useContentHeight();
  const navigate = useNavigate();

  const [tab, setTab] = useState('mc-mods');
  const [searchKey, setSearchKey] = useState('');

  const { data: instance } = useContextSelector(LauncherContext, (v) => v.findOneInstanceQuery(instanceId || ''));
  const instanceType: string = categoryMap.keyToText[tab].toLowerCase().replace(' ', '');
  const findContentInstanceQuery = useContextSelector(LauncherContext, (v) =>
    v.findContentInstanceQuery(instanceId!, instanceType),
  );

  return (
    <div className="h-full flex flex-col gap-2" style={{ height: isReady ? height : '0px' }}>
      {/* Tabs header */}
      <div className="flex flex-nowrap justify-between p-2 bg-base-300">
        <div className="flex">
          <button className="btn btn-soft btn-primary mr-4">
            <i className="fa-light fa-pen-to-square"></i>
          </button>
          {tabs.map((t, idx) => (
            <div key={t.key} className="flex items-center">
              <button
                className={`btn btn-ghost px-2 ${tab === t.key ? 'text-primary' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label} (0)
              </button>
              {idx < tabs.length - 1 && <div className="divider divider-horizontal m-0"></div>}
            </div>
          ))}
        </div>

        <Link to={'/'} className="btn btn-soft btn-circle">
          <i className="fa-light fa-xmark"></i>
        </Link>
      </div>

      {/* Search + Update All */}
      <div className="flex justify-between p-2">
        <div className="indicator">
          <span className="indicator-item badge badge-sm badge-primary badge-soft">12</span>
          <button className="btn btn-soft btn-primary">
            <i className="fa-light fa-clock-rotate-left"></i>
            Update All
          </button>
        </div>

        <label className="input">
          <i className="fa-light fa-magnifying-glass text-base-content/60"></i>
          <input
            type="search"
            className="grow"
            placeholder="Search..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
          />
        </label>

        <button
          className="btn btn-soft"
          onClick={() => {
            navigate({
              pathname: instanceId ? `/browse/${instanceId}` : '/browse',
              search: `?${createSearchParams(
                Object.entries({
                  categoryType: tab,
                  ...(instance?.version ? { gameVersion: instance.version } : {}),
                  ...(tab === 'mc-mods' && instance?.loader
                    ? { loaderType: loaderMap.keyToId[instance.loader.type]?.toString() }
                    : {}),
                }).filter(([_, v]) => v !== undefined && v !== null) as [string, string][],
              )}`,
            });
          }}
        >
          <i className="fa-light fa-plus"></i>
          Add Contents
        </button>
      </div>

      <ManagerTablePage
        contentData={
          findContentInstanceQuery.data?.data.filter(
            (item) => searchKey.trim() === '' || item.name.toLowerCase().includes(searchKey.toLowerCase()),
          ) ?? []
        }
        isLoading={findContentInstanceQuery.isLoading}
        contentType={categoryMap.keyToText[tab].toLowerCase().replace(' ', '')}
        onRefresh={() => findContentInstanceQuery.refetch()}
      />
    </div>
  );
}
