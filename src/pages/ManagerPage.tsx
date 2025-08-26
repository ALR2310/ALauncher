import { useState } from 'react';
import { Link } from 'react-router';

export default function ManagerPage() {
  const [tab, setTab] = useState('mods');

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-nowrap justify-between p-3 bg-base-300">
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

        <Link to={`${tab}`} className="btn btn-soft">
          <i className="fa-light fa-plus"></i>
          Add Contents
        </Link>
      </div>

      <div className={`overflow-auto flex flex-col h-full justify-between p-3`}>
        <table className="table">
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
