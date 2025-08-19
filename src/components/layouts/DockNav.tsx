import { useEffect, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { toast } from '~/hooks/useToast';
import { useWS } from '~/hooks/useWS';
import { LauncherContext } from '~/providers/LauncherProvider';

export default function DockNav() {
  const { send } = useWS();

  // Launcher Context selectors
  const launch = useContextSelector(LauncherContext, (ctx) => ctx.launch);
  const cancel = useContextSelector(LauncherContext, (ctx) => ctx.cancel);
  const progress = useContextSelector(LauncherContext, (ctx) => ctx.progress);
  const speed = useContextSelector(LauncherContext, (ctx) => ctx.speed);
  const estimated = useContextSelector(LauncherContext, (ctx) => ctx.estimated);
  const configs = useContextSelector(LauncherContext, (ctx) => ctx.configs);
  const setConfigs = useContextSelector(LauncherContext, (ctx) => ctx.setConfigs);
  const isPlaying = useContextSelector(LauncherContext, (ctx) => ctx.isPlaying);
  const version = useContextSelector(LauncherContext, (ctx) => ctx.version);
  const setVersion = useContextSelector(LauncherContext, (ctx) => ctx.setVersion);
  const versionList = useContextSelector(LauncherContext, (ctx) => ctx.versionList);

  const [username, setUsername] = useState('');

  useEffect(() => {
    if (configs) setUsername(configs.username);
  }, [configs]);

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

      <label className="input flex-1">
        <i className="fa-light fa-user"></i>
        <input
          type="text"
          className="grow"
          placeholder="Tên người dùng"
          value={username}
          onChange={(e) => {
            setConfigs('username', e.target.value);
          }}
        />
      </label>

      <Select
        className="flex-1"
        search={true}
        position="top"
        value={version}
        options={versionList ?? []}
        onChange={(value) => {
          setVersion(value);
        }}
        render={(item) => (
          <p className={`px-3 py-1 ${item.downloaded ? 'bg-base-content/10' : undefined}`}>{item.label}</p>
        )}
      />

      <button
        className="btn btn-primary flex-1"
        onClick={() => {
          if (!username) return toast.warning('Vui lòng nhập tên người dùng');
          if (!isPlaying) {
            launch();
          } else cancel();
        }}
      >
        {isPlaying ? 'Huỷ' : 'Chơi'}
      </button>

      <div className="flex-1 flex">
        <button
          className="btn btn-ghost flex-1"
          onClick={() => {
            window.location.reload();
          }}
        >
          <i className="fa-light fa-rotate-right"></i>
        </button>

        <button className="btn btn-ghost flex-1" onClick={() => send('app:openFolder')}>
          <i className="fa-light fa-folder-closed"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    </div>
  );
}
