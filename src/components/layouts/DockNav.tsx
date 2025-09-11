import { VersionDto } from '@shared/dtos/version.dto';
import { useEffect, useState } from 'react';
import { useContextSelector } from 'use-context-selector';

import { toast } from '~/hooks/useToast';
import { LauncherContext } from '~/providers/LauncherProvider';

import Select from '../Select';

export default function DockNav() {
  const [version, setVersion] = useState<VersionDto>(null!);

  // Launcher context
  const config = useContextSelector(LauncherContext, (v) => v.getConfig());
  const setConfig = useContextSelector(LauncherContext, (v) => v.setConfig);
  const openFolder = useContextSelector(LauncherContext, (v) => v.openFolder);
  const findAllVersionQuery = useContextSelector(LauncherContext, (v) => v.findAllVersionQuery);
  const launch = useContextSelector(LauncherContext, (v) => v.launch);
  const cancel = useContextSelector(LauncherContext, (v) => v.cancel);
  const isDownloading = useContextSelector(LauncherContext, (v) => v.isDownloading);
  const isRunning = useContextSelector(LauncherContext, (v) => v.isRunning);
  const progress = useContextSelector(LauncherContext, (v) => v.event.progress);
  const speed = useContextSelector(LauncherContext, (v) => v.event.speed);
  const estimated = useContextSelector(LauncherContext, (v) => v.event.estimated);

  // Sync version when config or versions change
  useEffect(() => {
    if (findAllVersionQuery.isLoading || !config) return;
    if (findAllVersionQuery.isError) return toast.error('Failed to fetch versions');

    const versions = findAllVersionQuery.data!;

    if (config.profile_selected.version === 'latest_release') {
      const latestRelease = versions.find((v) => v.type === 'release');
      if (latestRelease) setVersion(latestRelease);
    } else {
      setVersion(config.profile_selected);
    }
  }, [config, findAllVersionQuery.data, findAllVersionQuery.isError, findAllVersionQuery.isLoading]);

  return (
    <div id="dockNav" className="relative flex gap-4 p-3 bg-base-300">
      {isDownloading && (
        <div className="absolute left-0 bottom-[90%] w-full">
          <p className="absolute left-1/2 text-primary font-semibold z-10">
            {progress && progress < 100 ? `${progress}% - ${speed} - ${estimated}` : undefined}
          </p>
          <progress
            className="progress h-3 progress-no-rounded"
            value={progress && progress < 100 ? progress : undefined}
            max="100"
          ></progress>
        </div>
      )}

      <label className="input flex-1">
        <i className="fa-light fa-user"></i>
        <input
          type="text"
          className="grow"
          placeholder="Username"
          value={config?.auth.username || ''}
          onChange={(e) => {
            setConfig('auth.username', e.target.value);
          }}
        />
      </label>

      <Select
        className="flex-1"
        search={true}
        position="top"
        value={version?.name || ''}
        options={
          findAllVersionQuery.data?.map((v) => ({
            label: v.name,
            value: v.name,
            downloaded: v.downloaded,
          })) || []
        }
        onChange={(v) => {
          const selected = findAllVersionQuery.data?.find((ver) => ver.name === v);
          if (selected) setConfig('profile_selected', selected);
        }}
        render={(item) => (
          <p className={`px-3 py-1 ${item.downloaded ? 'bg-base-content/10' : undefined}`}>{item.label}</p>
        )}
      />

      <button
        className="btn btn-primary flex-1"
        onClick={() => {
          if (isRunning) cancel();
          else {
            if (!config?.auth.username) return toast.warning('Please enter your username');
            if (!version) return toast.warning('Please select a version');
            launch();
          }
        }}
      >
        {isRunning ? 'Cancel' : 'Play'}
      </button>

      <div className="flex-1 flex">
        <button className="btn btn-ghost flex-1" onClick={() => window.location.reload()}>
          <i className="fa-light fa-rotate-right"></i>
        </button>

        <button className="btn btn-ghost flex-1" onClick={openFolder}>
          <i className="fa-light fa-folder-closed"></i>
        </button>

        <button className="btn btn-ghost flex-1">
          <i className="fa-light fa-gear"></i>
        </button>
      </div>
    </div>
  );
}
