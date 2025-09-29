import { RemoveContentInstanceDto } from '@shared/dtos/instance.dto';
import { categoryMap, loaderMap } from '@shared/mappings/general.mapping';
import qs from 'qs';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { useFindContentsInstanceQuery, useFindOneInstanceQuery } from '~/hooks/api/useInstance';
import { useContainer } from '~/hooks/app/useContainer';

import InstanceTable from './components/InstanceTable';

export default function InstancePage() {
  const { id } = useParams<{ id: string }>();
  const { height, isReady } = useContainer();
  const navigate = useNavigate();

  const categories = Object.entries(categoryMap.keyToText).map(([key, label]) => ({ key, label }));
  const [categoryKey, setCategoryKey] = useState(categories[0].key);
  const [searchKey, setSearchKey] = useState('');

  const { data: instance } = useFindOneInstanceQuery(id!);
  const instanceType: RemoveContentInstanceDto['type'] = categoryMap.keyToText[categoryKey]
    .toLowerCase()
    .replace(' ', '');
  const { isLoading: isLoadingContents, data: instanceContents } = useFindContentsInstanceQuery(id!, instanceType);

  return (
    <div className="h-full flex flex-col gap-2" style={{ height: isReady ? height : '0px' }}>
      {/* Tabs header */}
      <div className="flex flex-nowrap justify-between p-2 bg-base-300">
        <div className="flex">
          <button className="btn btn-soft btn-primary mr-4">
            <i className="fa-light fa-pen-to-square"></i>
          </button>
          {categories.map((t, idx) => (
            <div key={t.key} className="flex items-center">
              <button
                className={`btn btn-ghost px-2 ${categoryKey === t.key ? 'text-primary' : ''}`}
                onClick={() => setCategoryKey(t.key)}
              >
                {t.label} (0)
              </button>
              {idx < categories.length - 1 && <div className="divider divider-horizontal m-0"></div>}
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
            const query = qs.stringify({
              ...(id ? { instance: id } : {}),
              categoryType: categoryKey,
              ...(instance?.version ? { gameVersion: instance.version } : {}),
              ...(categoryKey === 'mc-mods' && instance?.loader
                ? { loaderType: loaderMap.keyToId[instance.loader.type]?.toString() }
                : {}),
            });
            navigate(`/contents?${query}`);
          }}
        >
          <i className="fa-light fa-plus"></i>
          Add Contents
        </button>
      </div>

      <InstanceTable
        contentData={
          instanceContents?.data.filter(
            (item) => searchKey.trim() === '' || item.name.toLowerCase().includes(searchKey.toLowerCase()),
          ) ?? []
        }
        isLoading={isLoadingContents}
        contentType={instanceType}
      />
    </div>
  );
}
