import { useState } from 'react';
import { Link } from 'react-router';

export default function ManagerPage() {
  const [_tab, setTab] = useState('mods');
  const [searchKey, setSearchKey] = useState('');

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex flex-nowrap justify-between p-2 bg-base-300">
        <div className="flex">
          <button className="btn btn-ghost px-2" onClick={() => setTab('mods')}>
            Mods (0)
          </button>
          <div className="divider divider-horizontal m-0"></div>
          <button className="btn btn-ghost px-2" onClick={() => setTab('datapacks')}>
            Data Packs (0)
          </button>
          <div className="divider divider-horizontal m-0"></div>
          <button className="btn btn-ghost px-2" onClick={() => setTab('resourcepacks')}>
            Resource Packs (0)
          </button>
          <div className="divider divider-horizontal m-0"></div>
          <button className="btn btn-ghost px-2" onClick={() => setTab('shaderpacks')}>
            Shader Packs (0)
          </button>
          <div className="divider divider-horizontal m-0"></div>
          <button className="btn btn-ghost px-2" onClick={() => setTab('worlds')}>
            World (0)
          </button>
        </div>

        <Link to={`/browse`} className="btn btn-soft">
          <i className="fa-light fa-plus"></i>
          Add Contents
        </Link>
      </div>

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
      </div>

      <div className={`overflow-auto flex flex-col h-full justify-between p-2`}>
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
