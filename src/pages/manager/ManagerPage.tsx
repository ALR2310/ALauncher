import { loaderMap } from '@shared/constants/launcher.constant';
import { useState } from 'react';
import { createSearchParams, Link, useNavigate, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import { LauncherContext } from '~/providers/LauncherProvider';

const tabs = [
  { key: 'mc-mods', label: 'Mods' },
  { key: 'data-packs', label: 'Data Packs' },
  { key: 'texture-packs', label: 'Resource Packs' },
  { key: 'shaders', label: 'Shader Packs' },
  { key: 'worlds', label: 'World' },
];

export default function ManagerPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState('mc-mods');
  const [searchKey, setSearchKey] = useState('');

  const getInstanceQuery = useContextSelector(LauncherContext, (v) => v.getInstanceQuery(instanceId || ''));
  const instance = getInstanceQuery.data;

  const goToBrowse = () => {
    navigate({
      pathname: instanceId ? `/browse/${instanceId}` : '/browse',
      search: `?${createSearchParams({
        categoryType: tab,
        ...(instance?.version ? { gameVersion: instance.version } : {}),
        ...(instance?.loader ? { loaderType: loaderMap.toId[instance.loader.type] } : {}),
      })}`,
    });
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Tabs header */}
      <div className="flex flex-nowrap justify-between p-2 bg-base-300">
        <div className="flex">
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

        <button className="btn btn-soft" onClick={goToBrowse}>
          <i className="fa-light fa-plus"></i>
          Add Contents
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto flex flex-col h-full justify-between p-2">
        <table className="table table-pin-rows bg-base-100">
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <th>Additional utilities</th>
              <th>Author</th>
              <th>Activity</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}
