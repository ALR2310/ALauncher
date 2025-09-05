import { useNavigate, useParams } from 'react-router';

import Select from '~/components/Select';

export default function BrowseContentPage({ className }: { className?: string }) {
  const { instanceId } = useParams<{ instanceId: string }>();

  const navigate = useNavigate();

  return (
    <div className={`${className} flex flex-col p-3 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            className="w-36"
            value="2"
            options={[
              { label: 'Featured', value: '1' },
              { label: 'Popularity', value: '2' },
              { label: 'LastUpdated', value: '3' },
              { label: 'Name', value: '4' },
              { label: 'Author', value: '5' },
              { label: 'TotalDownloads', value: '6' },
              { label: 'ReleasedDate', value: '11' },
              { label: 'Rating', value: '12' },
            ]}
          />
          <label className="input w-64">
            <i className="fa-light fa-magnifying-glass"></i>
            <input type="text" placeholder="Search..." className="grow" />
          </label>
        </div>

        <button
          className="btn btn-soft btn-circle"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate(`/manager/${instanceId}`);
          }}
        >
          <i className="fa-light fa-xmark"></i>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="h-[25%] flex bg-base-100 p-3 rounded gap-4">
          <div className="flex justify-center items-center">
            <img
              src="https://media.forgecdn.net/avatars/thumbnails/1168/187/256/256/638739000879316947.png"
              alt="mod img"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* ModName and Author */}
            <div className="flex items-center font-semibold">
              <h3 className="text-base-content text-ellipsis-1">
                Modpack Name Modpack Name Modpack Name Modpack Name Modpack Name
              </h3>
              <div className="divider divider-horizontal"></div>
              <p className="text-base-content/60 text-nowrap">by Author Name</p>
            </div>

            {/* Description */}
            <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">
              This is a description of the modpack. It provides an overview of what the modpack includes and any other
              relevant information that users might find useful.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-base-content/70">
              <button className="btn btn-outline btn-xs">Mods</button>
              <p>
                <i className="fa-light fa-download"></i> 1.2k
              </p>
              <p>
                <i className="fa-light fa-clock-three"></i> 01/01/2025
              </p>
              <p>
                <i className="fa-light fa-database"></i> 150MB
              </p>
              <p>
                <i className="fa-light fa-gamepad-modern"></i> 1.20.4
              </p>
              <p>NeoForge</p>
            </div>
          </div>

          <div className="w-[15%]">
            <button className="btn btn-soft btn-primary w-full">Install</button>
          </div>
        </div>
      </div>
    </div>
  );
}
