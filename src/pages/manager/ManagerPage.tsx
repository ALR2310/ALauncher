import { useState } from 'react';
import { Link } from 'react-router';

import DataTable from '~/components/DataTable';

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
          Thêm nội dung
        </Link>
      </div>

      <DataTable className="p-3" />
    </div>
  );
}
