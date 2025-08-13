import { useEffect, useState } from 'react';

import Select from '~/components/Select';
import { useLauncher } from '~/hook/useLauncher';
import { toast } from '~/hook/useToast';

export default function DockNav() {
  const { launch, progress, speed, estimated, configs, setConfigs, isPlaying, version, versionList } = useLauncher();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (configs) setUsername(configs.username);
  }, [configs]);

  useEffect(() => {
    console.log(versionList);
  }, [versionList]);

  return (
    <div className="relative flex flex-nowrap gap-4 p-3 bg-base-300">
      {isPlaying && (
        <div className="absolute left-0 bottom-[90%] w-full">
          <p className="absolute left-1/2 text-primary font-semibold z-10">
            {progress ? `${progress}% ${'- ' + speed} ${'- ' + estimated}` : null}
          </p>
          <progress
            className="progress h-3 progress-no-rounded"
            value={progress ? progress : undefined}
            max="100"
          ></progress>
        </div>
      )}

      <input
        type="text"
        className="input flex-1"
        placeholder="Tên người dùng"
        value={username}
        onChange={(e) => {
          setConfigs('username', e.target.value);
        }}
      />

      <Select
        className="flex-1"
        search={true}
        position="top"
        value={version}
        options={versionList ?? []}
        onChange={(value) => {
          setConfigs('version_selected', value);
        }}
        render={(item) => (
          <p className={`px-3 py-1 ${item.downloaded ? 'bg-base-content/10' : undefined}`}>{item.label}</p>
        )}
      />

      <button
        className="btn btn-primary flex-1"
        disabled={isPlaying}
        onClick={() => {
          if (!username) return toast.warning('Vui lòng nhập tên người dùng');
          launch();
        }}
      >
        Vào trò chơi
      </button>

      <div className="flex-1 flex">
        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-rotate-right"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-folder-closed"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    </div>
  );
}
